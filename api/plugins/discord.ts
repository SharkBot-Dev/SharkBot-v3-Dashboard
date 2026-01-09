import fp from 'fastify-plugin';

export interface DiscordUser {
    id: string;
    username: string;
    avatar: string;
}

export interface DiscordGuild {
    id: string;
    name: string;
    icon: string;
    owner: boolean;
    permissions: string;
}

export default fp(async (fastify) => {
    const DISCORD_API_URL = 'https://discord.com/api/v10';

    const discordService = {
        async getUser(accessToken: string): Promise<DiscordUser> {
            const response = await fetch(`${DISCORD_API_URL}/users/@me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Failed to fetch Discord user');
            return response.json();
        },

        async getGuilds(accessToken: string): Promise<DiscordGuild[]> {
            const response = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Failed to fetch Discord guilds');
            return response.json();
        }
    };

    fastify.decorate('discordService', discordService);
});

declare module 'fastify' {
    interface FastifyInstance {
        discordService: {
            getUser(accessToken: string): Promise<DiscordUser>;
            getGuilds(accessToken: string): Promise<DiscordGuild[]>;
        };
    }
}