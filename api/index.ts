import Fastify from "fastify";
import moduleRoutes from "./routes/modules.js";
import oauthPlugin, { fastifyOauth2, type FastifyOAuth2Options, type OAuth2Namespace } from '@fastify/oauth2';

declare module 'fastify' {
  interface FastifyInstance {
    discordOAuth2: OAuth2Namespace;
  }
}

export default async function buildServer() {
    const fastify = Fastify({ logger: true });

    fastify.register(moduleRoutes, { prefix: "/api/modules" });

    // Oauth2認証
    fastify.register(fastifyOauth2, {
        name: 'discordOAuth2',
        credentials: {
            client: { id: process.env.CLIENT_ID, secret: process.env.CLIENT_SECRET },
            auth: fastifyOauth2.DISCORD_CONFIGURATION
        },
        startRedirectPath: '/login',
        callbackUri: 'http://localhost:3000/callback',
        scope: ['identify', 'guilds']
    } as FastifyOAuth2Options);

    fastify.get('/callback', async (request, reply) => {
        const { token } = await fastify.discordOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { authorization: `Bearer ${token.access_token}` },
        });
        return userResponse.json();
    });
    
    return fastify;
}