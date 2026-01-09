import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'discord.js';
import type { ModuleType } from './type.js';
import { fileURLToPath, pathToFileURL } from "url";

export async function loadModules(client: Client) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const modulesRoot = __dirname;
    
    if (!fs.existsSync(modulesRoot)) return;

    const moduleDirs = fs.readdirSync(modulesRoot).filter(file => {
        return fs.statSync(path.join(modulesRoot, file)).isDirectory();
    });

    for (const dirName of moduleDirs) {
        const dirPath = path.join(modulesRoot, dirName);
        const mainFile = fs.readdirSync(dirPath).find(file => 
            file.startsWith('main.') && (file.endsWith('.js'))
        );

        if (!mainFile) {
            console.warn(`[Skip] ${dirName} に main ファイルが見つかりませんでした。`);
            continue;
        }

        const filePath = path.join(dirPath, mainFile);
        
        try {
            const moduleExport = await import(pathToFileURL(filePath).href);
            // console.log(moduleExport)
            console.log(`[Module] ${moduleExport.default.name} をロードしました。`)
            const botModule: ModuleType = moduleExport.default || Object.values(moduleExport)[0];

            if (!botModule) continue;

            if (botModule.commands) {
                for (const cmd of botModule.commands) {
                    (client as any).commands?.set(cmd.data.name, cmd);
                    console.log(`[Command] ${cmd.data.name} をロードしました。`);
                }
            }

            if (botModule.events) {
                for (const event of botModule.events) {
                    const handler = (...args: any[]) => event.execute(client, ...args);
                    if (event.once) {
                        client.once(event.name, handler);
                    } else {
                        client.on(event.name, handler);
                    }
                    console.log(`[Event] ${event.name} をロードしました。`);
                }
            }
        } catch (error) {
            console.error(`[Error] ${dirName} の読み込みに失敗しました:`, error);
        }
    }
}