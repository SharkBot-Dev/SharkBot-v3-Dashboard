import type { FastifyInstance } from "fastify";
import { mongo } from "../../../lib/mongo.js";
import { moduleManager } from "../../../bot/moduleManager.js";
import { getChannels, getRoles, sendMessage } from "./../../../lib/discord.js"

export default async function (fastify: FastifyInstance) {
    fastify.get("/guilds/:guildId/rolepanel", { preHandler: [fastify.authGuard.checkAdmin] }, async (request, reply) => {
        const { guildId } = request.params as { guildId: string };
        const userId = request.session.get('userId');

        if (!userId) return reply.status(401).send({ error: 'ログインが必要です' });

        const dbUser = await mongo.db("DashboardBot").collection('GuildsList').findOne({ user: userId });
        if (!dbUser || !dbUser.guilds) return reply.status(404).send({ error: 'サーバーリストが見つかりません。' });

        const targetGuild = dbUser.guilds.find((g: any) => g.id === guildId);
        if (!targetGuild) return reply.status(403).send({ error: '権限がありません。' });

        const moded_modules = moduleManager.getModulesList(guildId);
        const path_name = "rolepanel";
        const current = moduleManager.isEnabled(guildId, path_name);

        const channels = await getChannels(guildId);
        const roles = await getRoles(guildId);

        return reply.view("modules/rolepanel/module.ejs", { 
            title: `${targetGuild.name} のロールパネル`,
            guild: targetGuild,
            moduleList: moded_modules,
            path: path_name,
            enabled: current,
            channels: channels,
            roles: roles,
            msg_title: "ロールパネル",
            msg_description: "下のボタンを押してロールを取得してください"
        });
    });

    fastify.post("/api/guilds/:guildId/rolepanel", { preHandler: [fastify.authGuard.checkAdmin] }, async (request, reply) => {
        const { guildId } = request.params as { guildId: string };
        const { title, description, channel, roles } = request.body as { 
            title: string, 
            description: string, 
            channel: string, 
            roles: string[] 
        };

        const now = Date.now();
        const cooldownMs = 5000;
        
        const db = mongo.db("DashboardBot");
        const cooldownCollection = db.collection('Cooldowns');

        const lastAction = await cooldownCollection.findOne({ guildId, type: 'rolepanel' });

        if (lastAction && (now - lastAction.timestamp) < cooldownMs) {
            const waitTime = Math.ceil((cooldownMs - (now - lastAction.timestamp)) / 1000);
            return reply.status(429).send({ error: `連投は制限されています。あと ${waitTime} 秒待ってください。` });
        }

        const userId = request.session.get('userId');
        const dbUser = await mongo.db("DashboardBot").collection('GuildsList').findOne({ user: userId });
        const targetGuild = dbUser?.guilds?.find((g: any) => g.id === guildId);
        if (!targetGuild) return reply.status(403).send({ error: '権限がありません。' });

        const guildRoles = await getRoles(guildId);
        const validRoles = roles.filter(roleId => guildRoles.some((r: any) => r.id === roleId));

        if (validRoles.length === 0) {
            return reply.status(400).send({ error: '有効なロールが選択されていません。' });
        }

        try {
            const buttons = validRoles.slice(0, 5).map(roleId => ({
                type: 2,
                style: 1,
                label: guildRoles.find((r: any) => r.id === roleId)?.name || "Role",
                custom_id: `rolepanel_v1+${roleId}`
            }));

            await sendMessage(channel, {
                embeds: [{
                    title: title || "ロールパネル",
                    description: description || "ボタンを押してロールを取得",
                    color: 0x5865F2
                }],
                components: buttons.length > 0 ? [{
                    type: 1,
                    components: buttons
                }] : []
            });

            await cooldownCollection.updateOne(
                { guildId, type: 'rolepanel' },
                { $set: { timestamp: now } },
                { upsert: true }
            );

            return { success: true };
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: '送信中にエラーが発生しました' });
        }
    });
}