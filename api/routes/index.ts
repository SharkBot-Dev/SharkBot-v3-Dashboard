import type { FastifyInstance } from "fastify";
import { mongo } from "../../lib/mongo.js";
import { modules } from "./../../bot/temps/modules.js";
import { moduleManager } from "../../bot/moduleManager.js";

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

    fastify.get("/guilds/:guildId", { preHandler: [fastify.authGuard.checkAdmin] }, async (request, reply) => {
        const { guildId } = request.params as { guildId: string };

        const userId = request.session.get('userId');
        if (!userId) {
            return reply.status(401).send({ error: 'ログインが必要です' });
        }

        const dbUser = await mongo.db("DashboardBot").collection('GuildsList').findOne({ user: userId });

        if (!dbUser || !dbUser.guilds) {
            return reply.status(404).send({ error: 'サーバーリストが見つかりません。' });
        }

        const targetGuild = dbUser.guilds.find((g: any) => g.id === guildId);
        
        if (!targetGuild) {
            return reply.status(403).send({ error: '指定されたサーバーへのアクセス権限がありません。' });
        }

        const moded_modules = moduleManager.getModulesList(guildId);

        return reply.view("modules/module.ejs", { 
            title: `${targetGuild.name} の設定`,
            guild: targetGuild,
            moduleList: moded_modules
        });
    });
}