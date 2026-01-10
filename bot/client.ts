import { Client, Collection, GatewayIntentBits } from "discord.js";

export const client = new Client({
    intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
})

export const commands = new Collection<string, any>();