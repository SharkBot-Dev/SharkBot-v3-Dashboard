import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ModuleType } from "./../type.js";
import { modules } from "./../../temps/modules.js";
import { moduleManager } from "../../moduleManager.js";

export default {
    name: "ヘルプ",
    pathname: "help",
    emoji: "❓",
    description: "コマンドの使い方を調べられます。",
    enabled: true,
    events: [],
    commands: [
        {
            data: new SlashCommandBuilder()
                .setName("help")
                .setDescription("ヘルプを表示します。"),
            execute: async (interaction: ChatInputCommandInteraction) => {
                if (!interaction.guild) {
                    return;
                }

                if (!moduleManager.isEnabled(interaction.guild.id, "help")) {
                    await interaction.reply({
                        content: 'ヘルプモジュールが無効化されています。\n\nダッシュボードで設定を確認してください。\nhttps://dashboard.sharkbot.xyz/',
                        flags: MessageFlags.Ephemeral,
                    })
                    return;
                };

                await interaction.deferReply();

                const embed = new EmbedBuilder()
                    .setTitle(`SharkBotのヘルプ`)
                    .setColor(0x00AE86)
                    .setDescription("現在有効なモジュールとコマンドの一覧です。")
                    .setTimestamp();

                modules.forEach(mod => {
                    if (!mod.enabled) return;

                    const cmdList = mod.commands
                        ?.map((cmd: any) => `\`/${cmd.data.name}\``)
                        .join(", ");

                    if (cmdList) {
                        embed.addFields({
                            name: `${mod.emoji || "📁"} ${mod.name}`,
                            value: `${mod.description}\n${cmdList}`,
                            inline: false
                        });
                    }
                });

                if (embed.data.fields?.length === 0) {
                    embed.setDescription("利用可能なコマンドが見つかりませんでした。");
                }

                await interaction.editReply({ embeds: [embed] });
            }
        },
        {
            data: new SlashCommandBuilder()
                .setName("dashboard")
                .setDescription("ダッシュボードのリンクを取得します。"),
            execute: async (interaction: ChatInputCommandInteraction) => {
                if (!interaction.guild) {
                    return;
                }

                if (!moduleManager.isEnabled(interaction.guild.id, "help")) {
                    await interaction.reply({
                        content: 'ヘルプモジュールが無効化されています。\n\nダッシュボードで設定を確認してください。\nhttps://dashboard.sharkbot.xyz/',
                        flags: MessageFlags.Ephemeral,
                    })
                    return;
                };

                    await interaction.reply({
                        content: '以下からアクセスできます。\nhttps://dashboard.sharkbot.xyz/',
                        flags: MessageFlags.Ephemeral,
                    })
            }
        }
    ]
} as ModuleType;