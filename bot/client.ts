import { Client, GatewayIntentBits } from "discord.js";

export const client = new Client({
    intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.Guilds]
})