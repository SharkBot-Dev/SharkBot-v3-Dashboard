import Fastify from "fastify";
import moduleRoutes from "./routes/modules.js";
import indexRoutes from "./routes/index.js";
import oauthPlugin, { fastifyOauth2, type FastifyOAuth2Options, type OAuth2Namespace } from '@fastify/oauth2';
import autoLoad from '@fastify/autoload';
import path, { join } from "path";
import { mongo } from "../lib/mongo.js";
import { fileURLToPath } from "url";
import session from "./plugins/session.js";
import discord from "./plugins/discord.js";
import authGuard from "./plugins/auth-guard.js";
import view from "./plugins/view.js";

declare module 'fastify' {
    interface FastifyInstance {
        discordOAuth2: OAuth2Namespace;
    }
}

export default async function buildServer() {
    const fastify = Fastify({ logger: true });

    fastify.register(session);
    fastify.register(discord);
    fastify.register(authGuard);
    fastify.register(view);

    fastify.register(indexRoutes, { prefix: "/" });
    fastify.register(moduleRoutes, { prefix: "/" });

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    fastify.register(autoLoad, {
        dir: join(__dirname, 'routes/modules'),
        options: { prefix: '/' }
    });

    // Oauth2認証
    fastify.register(fastifyOauth2, {
        name: 'discordOAuth2',
        credentials: {
            client: { id: process.env.CLIENT_ID, secret: process.env.CLIENT_SECRET },
            auth: fastifyOauth2.DISCORD_CONFIGURATION
        },
        startRedirectPath: '/login',
        callbackUri: process.env.REDIRECT_URI,
        scope: ['identify', 'guilds']
    } as FastifyOAuth2Options);

    fastify.get('/callback', async (request, reply) => {
        const { token } = await fastify.discordOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        const user = await fastify.discordService.getUser(token.access_token);
        const guilds = await fastify.discordService.getGuilds(token.access_token);

        await mongo.db("DashboardBot").collection('GuildsList').updateOne(
            { user: user.id },
            { $set: { guilds: guilds, lastLogin: new Date() } },
            { upsert: true }
        );

        request.session.set('userId', user.id);

        return reply.redirect('/');
    });

    // 404エラー対策
    // fastify.setNotFoundHandler((request, reply) => {
    //     return reply.status(404).view('errors/404.ejs', {
    //         title: "404"
    //     });
    // });
    
    return fastify;
}