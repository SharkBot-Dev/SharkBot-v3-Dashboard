import type { FastifyInstance } from "fastify";
import { mongo } from "../../lib/mongo.js";

export default async function (fastify: FastifyInstance) {
    fastify.get("/guilds", async (request, reply) => {
        const userId = request.session.get('userId');
        if (!userId) {
            return reply.status(401).send({ error: 'ログインが必要です' });
        }

        const dbUser = await mongo.db("DashboardBot").collection('GuildsList').findOne({ user: userId });

        const allGuilds = dbUser?.guilds || [];
        const adminGuilds = allGuilds.filter((guild: any) => {
            const isAdmin = (BigInt(guild.permissions) & BigInt(0x8)) === BigInt(0x8);
            return guild.owner || isAdmin;
        });

        return reply.view("guilds.ejs", { 
            guilds: adminGuilds,
            user: userId,
            title: "サーバーの一覧"
        });
    });

    fastify.get("/guilds/:guildId/", { preHandler: [fastify.authGuard.checkAdmin] }, async (request, reply) => {
        const body = request.body as any;
        const guildId = body?.guildId;

        const userId = request.session.get('userId');
        if (!userId) {
            return reply.status(401).send({ error: 'ログインが必要です' });
        }

        const dbUser = await mongo.db("DashboardBot").collection('GuildsList').findOne({ user: userId });

        const guilds = dbUser?.guilds;
        if (!guilds) return reply.status(401).send({ error: 'サーバーが見つかりません。' });

        const targetGuild = dbUser?.guilds?.find((g: any) => g.id === guildId);
        if (!targetGuild) return reply.status(401).send({ error: 'サーバーが見つかりません。' });

        return reply.view("modules/module.ejs", { title: `${targetGuild.name} のモジュール` });
    });
}