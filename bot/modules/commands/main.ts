import { Client, Events, Message, MessageFlags, type Interaction } from "discord.js";
import type { ModuleType } from "./../type.js";
import { moduleManager } from "./../../moduleManager.js";
import { commands } from "../../client.js";

export default {
    name: "コマンド",
    pathname: "commands",
    emoji: "💬",
    description: "スラッシュコマンドなどを使用できるようにします。",
    enabled: true,
    events: [
        {
            name: Events.InteractionCreate,
            execute: async (client: any, interaction: Interaction) => {
                if (interaction.user.bot) {
                    return;
                }

                if (!interaction.guild) return;
                if (!interaction.isChatInputCommand()) return;

                if (!moduleManager.isEnabled(interaction.guild.id, "commands")) {
                    await interaction.reply({
                        content: 'コマンドモジュールが無効化されています。',
                        flags: MessageFlags.Ephemeral,
                    })
                    return;
                };

                const command = commands.get(interaction.commandName) as any;

                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error(error);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({
                            content: 'コマンド実行時にエラーが発生しました。',
                            flags: MessageFlags.Ephemeral,
                        });
                    } else {
                        await interaction.reply({
                            content: 'コマンド実行時にエラーが発生しました。',
                            flags: MessageFlags.Ephemeral,
                        });
                    }
                }
            }
        }
    ],
    commands: []
} as ModuleType;