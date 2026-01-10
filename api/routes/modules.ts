import type { FastifyInstance } from "fastify";
import { moduleManager } from "./../../bot/moduleManager.js";
import { getModule } from "../../bot/temps/modules.js";
import { addCommands, deleteCommands, getCommand } from "../../lib/discord.js";
import NodeCache from "node-cache";

const addCommandCache = new NodeCache({ stdTTL: 5, checkperiod: 5 });

export default async function (fastify: FastifyInstance) {
    fastify.post("/api/modules/toggle", {
        preHandler: [fastify.authGuard.checkAdmin] 
    }, async (req, reply) => {
        const { guildId, module } = req.body as any;

        const current = moduleManager.isEnabled(guildId, module);
        await moduleManager.set(guildId, module, !current);

        return { enabled: !current };
    });

    fastify.post("/api/modules/commands", {
        preHandler: [fastify.authGuard.checkAdmin] 
    }, async (req, reply) => {
        const { guildId, module, command, enabled } = req.body as any;

        const module_commands = getModule(module);
        if (!module_commands) return reply.status(404).send({ error: 'コマンドが見つかりません。' });

        const value = addCommandCache.get(guildId);
        if (value !== undefined) {
            return reply.status(429).send({ error: 'リクエストが早すぎます。' });
        }

        if (enabled) {
            const targetCommand = module_commands.commands.find((c: any) => c.data.name === command);

            if (!targetCommand) {
                return reply.status(404).send({ error: 'コマンドが見つかりません。' });
            }

            await addCommands(guildId, targetCommand.data);

            return { success: true };
        } else {
            const targetCommand = module_commands.commands.find((c: any) => c.data.name === command);

            if (!targetCommand) {
                return reply.status(404).send({ error: 'コマンドが見つかりません。' });
            }
            
            const cmd = await getCommand(guildId, targetCommand.data.name);
            if (cmd) {
                await deleteCommands(guildId, cmd.id);
            }
        }

        addCommandCache.set(guildId, guildId);

        return { success: true };
    });
}