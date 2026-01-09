import { Client, Events, Message } from "discord.js";
import type { ModuleType } from "./../type.js";
import { moduleManager } from "./../../moduleManager.js";

export default {
    name: "テストモジュール",
    pathname: "testmodule",
    emoji: "🛠️",
    description: "テスト用モジュール",
    enabled: true,
    events: [
        {
            name: Events.MessageCreate,
            execute: async (client, message) => {
                if (message.author.bot) {
                    return;
                }

                if (!message.guild) return;

                if (!moduleManager.isEnabled(message.guild.id, "testmodule")) return;

                if (message.content == "test") {
                    await message.reply('Test.')
                }
            }
        }
    ],
    commands: []
} as ModuleType;