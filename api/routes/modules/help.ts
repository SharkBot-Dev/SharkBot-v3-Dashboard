import type { FastifyInstance } from "fastify";
import { mongo } from "../../../lib/mongo.js";
import { moduleManager } from "../../../bot/moduleManager.js";
import { addCommands, deleteCommands, getCommand, getCommands } from "./../../../lib/discord.js"
import NodeCache from "node-cache";
import { getModule, modules } from "./../../../bot/temps/modules.js";

const addHelpCommandCache = new NodeCache({ stdTTL: 5, checkperiod: 5 });

export default async function (fastify: FastifyInstance) {
    fastify.get("/guilds/:guildId/help", { preHandler: [fastify.authGuard.checkAdmin] }, async (request, reply) => {
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

        const path_name = "help"
        const current = moduleManager.isEnabled(guildId, path_name);

        const cmd = await getCommand(guildId, "help");

        return reply.view("modules/help/module.ejs", { 
            title: `${targetGuild.name} のヘルプ`,
            guild: targetGuild,
            moduleList: moded_modules,
            path: path_name,
            enabled: current,
            help_command_enabled: true? cmd : false
        });
    });

    fastify.post("/api/guilds/:guildId/help", { preHandler: [fastify.authGuard.checkAdmin] }, async (request, reply) => {
        const { guildId } = request.params as { guildId: string };
        const { enabled } = request.body as { enabled: boolean };

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

        const value = addHelpCommandCache.get(guildId);
        if (value !== undefined) {
            return reply.status(429).send({ error: 'リクエストが早すぎます。' });
        }

        const module_commands = getModule("help");
        if (!module_commands) return reply.status(404).send({ error: 'コマンドが見つかりません。' });

        if (enabled) {
            await addCommands(guildId, module_commands.commands[0].data);
        } else {
            const cmd = await getCommand(guildId, module_commands.commands[0].data.name);
            if (cmd) {
                await deleteCommands(guildId, cmd.id);
            }
        }

        addHelpCommandCache.set(guildId, guildId);

        return { success: true };
    });
}