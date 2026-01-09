import Fastify from "fastify";
import moduleRoutes from "./routes/modules.js";

export default async function buildServer() {
    const fastify = Fastify({ logger: true });

    fastify.register(moduleRoutes, { prefix: "/api/modules" });

    return fastify;
}