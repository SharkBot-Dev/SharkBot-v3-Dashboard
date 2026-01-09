import NodeCache from "node-cache";

const DISCORD_API_URL = 'https://discord.com/api/v10';

const discordChannelsCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

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