import { client } from "./bot/client.js";
import buildServer from "./api/index.js";
import { moduleManager } from "./bot/moduleManager.js";

async function start() {
    await moduleManager.loadAll();
  
    await client.login(process.env.DISCORD_TOKEN!);

    const server = await buildServer();
    await server.listen({ port: 3000 });
}

start();