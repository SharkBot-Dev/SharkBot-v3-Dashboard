import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { mongo } from '../../lib/mongo.js';

export default fp(async (fastify) => {
    const checkAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = request.session.get('userId');
        if (!userId) {
            return reply.status(401).send({ error: 'ログインが必要です' });
        }

        const params = request.params as any;
        const body = request.body as any;
        const query = request.query as any;

        const guildId = params?.guildId || body?.guildId || query?.guildId;

        const dbUser = await mongo.db("DashboardBot").collection('GuildsList').findOne({ user: userId });
        const targetGuild = dbUser?.guilds?.find((g: any) => g.id === guildId);

        if (!targetGuild) {
            return reply.status(403).send({ error: '管理者権限がありません' });
        }

        const isAdmin = targetGuild.owner || (BigInt(targetGuild.permissions) & BigInt(0x8));
        if (!isAdmin) {
            return reply.status(403).send({ error: '管理者権限がありません' });
        }
    };

    fastify.decorate('authGuard', { checkAdmin });
});

declare module 'fastify' {
    interface FastifyInstance {
        authGuard: {
            checkAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        };
    }
}