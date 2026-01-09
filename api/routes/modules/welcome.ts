import type { FastifyInstance } from "fastify";
import { mongo } from "../../../lib/mongo.js";
import { moduleManager } from "../../../bot/moduleManager.js";
import { Long } from "mongodb";
import { getChannels } from "./../../../lib/discord.js"

export default async function (fastify: FastifyInstance) {
    fastify.get("/guilds/:guildId/welcome", { preHandler: [fastify.authGuard.checkAdmin] }, async (request, reply) => {
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

        const channels = await getChannels(guildId);
        // console.log(channels);

        const moded_modules = moduleManager.getModulesList(guildId);

        const db = mongo.db("Main").collection("WelcomeMessage");
        const messages = await db.findOne({
            Guild: new Long(guildId)
        })

        const path_name = "welcome"
        const current = moduleManager.isEnabled(guildId, path_name);

        return reply.view("modules/welcome/module.ejs", { 
            title: `${targetGuild.name} の参加メッセージ`,
            guild: targetGuild,
            moduleList: moded_modules,
            msg_title: messages?.Title,
            msg_description: messages?.Description,
            channels: channels,
            path: path_name,
            enabled: current
        });
    });

    fastify.delete("/api/guilds/:guildId/welcome", { preHandler: [fastify.authGuard.checkAdmin] }, async (request, reply) => {
        const { guildId } = request.params as { guildId: string };
        const { title, description, channel } = request.body as { title: string, description: string, channel: string };

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

        const db = mongo.db("Main").collection("WelcomeMessage");
        await db.deleteOne({
            Guild: new Long(guildId)
        })

        return { success: true };
    });

    fastify.post("/api/guilds/:guildId/welcome", { preHandler: [fastify.authGuard.checkAdmin] }, async (request, reply) => {
        const { guildId } = request.params as { guildId: string };
        const { title, description, channel } = request.body as { title: string, description: string, channel: string };

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

        // チャンネル存在チェック
        const channels = await getChannels(guildId);

        const channelsData = Array.isArray((channels as any))
            ? channels as any
            : channels;

        const exists = channelsData.some((c: any) => c.id === channel);
        if (!exists) return reply.status(403).send({ error: 'そのチャンネルは指定できません。' });

        const db = mongo.db("Main").collection("WelcomeMessage");
        await db.updateOne({
            Guild: new Long(guildId)
        }, {
            "$set": {
                Title: title,
                Description: description,
                Channel: new Long(channel)
            }
        }, {
            upsert: true
        })

        return { success: true };
    });
}