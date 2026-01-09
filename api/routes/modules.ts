import type { FastifyInstance } from "fastify";
import { moduleManager } from "./../../bot/moduleManager.js";

export default async function (
  fastify: FastifyInstance
) {
    fastify.post("/modules/toggle", async (req) => {
        const { guildId, module } = req.body as any;
    
        const current = moduleManager.isEnabled(guildId, module);
        await moduleManager.set(guildId, module, !current);

        return { enabled: !current };
    });
}