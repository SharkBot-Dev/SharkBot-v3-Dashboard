import type { FastifyInstance } from "fastify";
import { mongo } from "../../../lib/mongo.js";
import { moduleManager } from "../../../bot/moduleManager.js";
import { getChannels, getCommand, getCommandCooldownd } from "./../../../lib/discord.js"
import { Long } from "mongodb";

export default async function (fastify: FastifyInstance) {
    fastify.get("/guilds/:guildId/levels", { preHandler: [fastify.authGuard.checkAdmin] }, async (request, reply) => {
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

        const path_name = "levels"
        const current = moduleManager.isEnabled(guildId, path_name);

        const rank_commands = await getCommandCooldownd(guildId, "rank");

        let msg_title: string = "{user} さんのレベルが {level} にアップしたよ！";
        let msg_description: string = "GG!";

        const level_config = mongo.db("DashboardBot").collection("LevelsConfig");
        const levelConfig = await level_config.findOne({
            guild_id: new Long(guildId)
        });
        if (levelConfig) {
            if (levelConfig.message_title) {
                msg_title = levelConfig.message_title;
            }

            if (levelConfig.message_description) {
                msg_description = levelConfig.message_description;
            }
        }

        const channels = await getChannels(guildId);

        return reply.view("modules/levels/module.ejs", { 
            title: `${targetGuild.name} のレベル`,
            guild: targetGuild,
            moduleList: moded_modules,
            path: path_name,
            enabled: current,
            rank_commands_enabled: true? rank_commands : false,
            msg_title: msg_title,
            msg_description: msg_description,
            channels: channels,
        });
    });

    fastify.post("/api/guilds/:guildId/levels/message", { preHandler: [fastify.authGuard.checkAdmin] }, async (request, reply) => {
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

        if (channel == "message_reply") {
            const db = mongo.db("DashboardBot").collection("LevelsConfig");
            await db.updateOne({
                guild_id: new Long(guildId)
            }, {
                "$set": {
                    message_title: title,
                    message_description: description,
                    message_sendtype: "reply"
                }
            }, {
                upsert: true
            })

            return { success: true };
        }

        // チャンネル存在チェック
        const channels = await getChannels(guildId);

        const channelsData = Array.isArray((channels as any))
            ? channels as any
            : channels;

        const exists = channelsData.some((c: any) => c.id === channel);
        if (!exists) return reply.status(403).send({ error: 'そのチャンネルは指定できません。' });

        const db = mongo.db("DashboardBot").collection("LevelsConfig");
        await db.updateOne({
            guild_id: new Long(guildId)
        }, {
            "$set": {
                message_title: title,
                message_description: description,
                message_channel_id: new Long(channel),
                message_sendtype: "channel"
            }
        }, {
            upsert: true
        })

        return { success: true };
    });
}