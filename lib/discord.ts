import { REST, Routes, type SlashCommandBuilder } from "discord.js";
import NodeCache from "node-cache";

const DISCORD_API_URL = 'https://discord.com/api/v10';

const discordChannelsCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
const getSlashCommandCache = new NodeCache({ stdTTL: 30, checkperiod: 20 });

export async function getChannels(guildId: string) {
    const url = `${DISCORD_API_URL}/guilds/${guildId}/channels`;

    const value = discordChannelsCache.get(url);
    if (value !== undefined) {
        return value;
    }

    const channel = await fetch(url, {
        headers: {
            authorization: `Bot ${process.env.DISCORD_TOKEN}`
        }
    });

    const data = await channel.json();
    
    discordChannelsCache.set(url, data);
    return data;
}

export async function getCommands(guildId: string) {
    const url = `${DISCORD_API_URL}/applications/${process.env.CLIENT_ID}/guilds/${guildId}/commands`;

    const value = getSlashCommandCache.get(url);
    if (value !== undefined) {
        return value;
    }

    const channel = await fetch(url, {
        headers: {
            authorization: `Bot ${process.env.DISCORD_TOKEN}`
        },
        method: "GET"
    });

    const data = await channel.json();
    
    getSlashCommandCache.set(url, data);
    return data;
}

export async function getCommandsNoCooldown(guildId: string) {
    const url = `${DISCORD_API_URL}/applications/${process.env.CLIENT_ID}/guilds/${guildId}/commands`;

    const channel = await fetch(url, {
        headers: {
            authorization: `Bot ${process.env.DISCORD_TOKEN}`
        },
        method: "GET"
    });

    const data = await channel.json();
    return data;
}

export async function getCommandCooldownd(guildId: string, name: string) {
    const cmds = await getCommands(guildId);

    for (const m of cmds) {
        if (m.name === name) {
            return m;
        }
    }

    return undefined;
}

export async function getCommand(guildId: string, name: string) {
    const cmds = await getCommandsNoCooldown(guildId);

    for (const m of cmds) {
        if (m.name === name) {
            return m;
        }
    }

    return undefined;
}

export async function addCommands(guildId: string, slashcommand: SlashCommandBuilder) {
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN as string);

    await rest.post(
        Routes.applicationGuildCommands(process.env.CLIENT_ID as string, guildId),
        { body: slashcommand.toJSON() },
    );
    
    return;
}

export async function deleteCommands(guildId: string, id: string) {
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN as string);

    await rest.delete(
        Routes.applicationGuildCommand(process.env.CLIENT_ID as string, guildId, id)
    );

    return;
}