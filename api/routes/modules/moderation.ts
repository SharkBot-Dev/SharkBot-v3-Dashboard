import type { FastifyInstance } from "fastify";
import { mongo } from "../../../lib/mongo.js";
import { moduleManager } from "../../../bot/moduleManager.js";
import { getCommand, getCommandCooldownd } from "./../../../lib/discord.js"
import NodeCache from "node-cache";

export default async function (fastify: FastifyInstance) {
    fastify.get("/guilds/:guildId/moderation", { preHandler: [fastify.authGuard.checkAdmin] }, async (request, reply) => {
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

        const path_name = "moderation"
        const current = moduleManager.isEnabled(guildId, path_name);

        const clear_commands = await getCommandCooldownd(guildId, "clear");
        const remake_commands = await getCommandCooldownd(guildId, "remake");

        return reply.view("modules/moderation/module.ejs", { 
            title: `${targetGuild.name} のモデレーション`,
            guild: targetGuild,
            moduleList: moded_modules,
            path: path_name,
            enabled: current,
            clear_commands_enabled: true? clear_commands : false,
            remake_commands_enabled: true? remake_commands : false,
        });
    });
}