import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import type { ModuleType } from "./../type.js";
import { error_embed, success_embed } from "./../../../lib/make_embed.js"
import { sleep } from "../../../lib/sleep.js";

export default {
    name: "モデレーター",
    pathname: "moderation",
    emoji: "🔨",
    description: "メンバーを処罰するコマンドを追加します",
    enabled: true,
    events: [],
    commands: [
        // メッセージの削除コマンド
        {
            data: new SlashCommandBuilder()
                .setName("clear")
                .setDescription("メッセージを削除します。")
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
                .addNumberOption((option) => option.setName("count").setMinValue(2).setMaxValue(100).setRequired(true).setDescription("削除するメッセージの数")),
            execute: async (interaction: ChatInputCommandInteraction) => {
                if (interaction.member == null) return;
                if (interaction.channel == null) return;

                const count = interaction.options.getNumber("count", true);

                if (
                    typeof interaction.member.permissions !== "string" &&
                    interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) === false
                ) {
                    return await interaction.reply({
                        embeds: [((await error_embed("あなたに権限がありません。")).setDescription("必要な権限: チャンネルの管理"))],
                        flags: [MessageFlags.Ephemeral]
                    });
                }

                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                try {
                    const messages = (await interaction.channel.messages.fetch({ limit: 100 }))
                    .first(count);

                    if (interaction.channel.isTextBased()) {
                        await (interaction.channel as import("discord.js").TextChannel).bulkDelete(messages);
                    } else {
                        await interaction.followUp({
                            content: 'このコマンドはテキストチャンネル・ボイスチャンネル・スレッドでのみ使用できます。',
                            flags: MessageFlags.Ephemeral,
                        });
                        return;
                    }

                    await interaction.followUp({
                        embeds: [(await success_embed('メッセージを削除しました。'))],
                        flags: MessageFlags.Ephemeral,
                    });
                } catch (e) {
                    await interaction.followUp({
                        content: 'メッセージ削除に失敗しました。\n2週間以上前のメッセージは削除できません。',
                        flags: MessageFlags.Ephemeral,
                    });
                }
            }
        },
        // チャンネル再生成コマンド
        {
            data: new SlashCommandBuilder()
                .setName("remake")
                .setDescription("チャンネルを再生成します。")
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
            execute: async (interaction: ChatInputCommandInteraction) => {
                if (interaction.member == null) return;
                if (interaction.channel == null) return;

                if (
                    typeof interaction.member.permissions !== "string" &&
                    interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) === false
                ) {
                    return await interaction.reply({
                        embeds: [((await error_embed("あなたに権限がありません。")).setDescription("必要な権限: チャンネルの管理"))],
                        flags: [MessageFlags.Ephemeral]
                    });
                }

                await interaction.deferReply();

                try {
                    if (interaction.channel.isDMBased()) return;
                    if (interaction.channel.isThread()) return;

                    const channel = await interaction.channel.clone();

                    sleep(1000);

                    await channel.edit({
                        position: interaction.channel.position
                    })

                    sleep(1000);

                    await interaction.channel?.delete()

                    const embed = await success_embed("チャンネルを再生成しました。");
                    embed.setDescription(`実行者: <@${interaction.user.id}>`)

                    await channel.send({
                        embeds: [embed]
                    })
                } catch (e) {
                    return;
                }
            }
        }
    ]
} as ModuleType;