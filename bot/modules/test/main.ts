import { Client, Events, Message } from "discord.js";
import type { ModuleType } from "./../type.js";

export default {
    name: "testmodule",
    description: "テスト用モジュール",
    enabled: true,
    events: [
        {
            name: Events.MessageCreate,
            execute: async (client, message) => {
                if (message.author.bot) {
                    return;
                }

                if (message.content == "test") {
                    await message.reply('Test.')
                }
            }
        }
    ],
    commands: []
} as ModuleType;