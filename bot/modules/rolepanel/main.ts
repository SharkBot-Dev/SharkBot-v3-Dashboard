import { ChatInputCommandInteraction, EmbedBuilder, Events, MessageFlags, PermissionFlagsBits, PermissionsBitField, SlashCommandBuilder, type Interaction } from "discord.js";
import type { ModuleType } from "./../type.js";

export default {
    name: "ロールパネル",
    pathname: "rolepanel",
    emoji: "😆",
    description: "ボタンを押すだけでロールを受け取れるパネルを作成します。",
    enabled: true,
    events: [
        {
            name: Events.InteractionCreate,
            execute: async (client: any, interaction: Interaction) => {
                if (interaction.user.bot) {
                    return;
                }

                if (!interaction.guild) return;

                if (!interaction.isButton()) return;

                if (!interaction.customId.startsWith("rolepanel_v1+")) return;

                await interaction.deferReply({
                    flags: [MessageFlags.Ephemeral]
                })

                const role_id = interaction.customId.split("+")[1];
                const role = interaction.guild.roles.cache.get(role_id as string);
                if (!role) {
                    await interaction.editReply({
                        content: "ロールが見つかりません。"
                    })
                    return;
                };
                if (!role.editable) {
                    await interaction.editReply({
                        content: "そのロールは付与できません。"
                    })
                    return;
                };

                const member = interaction.guild.members.cache.get(interaction.user.id);
                const hasRole = member?.roles.cache.some(role => role.id === role_id);

                if (hasRole) {
                    await member?.roles.remove(role);

                    await interaction.editReply({
                        content: "ロールを剥奪しました。"
                    })
                } else {
                    await member?.roles.add(role);

                    await interaction.editReply({
                        content: "ロールを追加しました。"
                    })
                }
            }
        }
    ],
    commands: []
} as ModuleType;