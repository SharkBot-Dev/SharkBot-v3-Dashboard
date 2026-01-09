import fp from 'fastify-plugin';
import session from '@fastify/secure-session';

declare module "@fastify/secure-session" {
    interface SessionData {
        userId: string;
    }
}

export default fp(async (fastify) => {
    fastify.register(session, {
        key: Buffer.from('a'.repeat(32), 'utf8'), 
        cookie: {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        }
    });
});