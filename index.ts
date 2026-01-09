import { client } from "./bot/client.js";
import buildServer from "./api/index.js";
import { moduleManager } from "./bot/moduleManager.js";
import { connectMongo } from "./lib/mongo.js";
import { loadModules } from "./bot/modules/loader.js";

async function start() {
    await connectMongo();

    loadModules(client);
    await moduleManager.loadAll();
  
    await client.login(process.env.DISCORD_TOKEN!);

    const server = await buildServer();
    await server.listen({ port: 3000 });
}

start();