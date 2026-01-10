import { mongo } from "./../lib/mongo.js";
import { modules } from "./temps/modules.js";

type GuildId = string;
type ModulePath = string;

export class ModuleManager {
    private cache = new Map<GuildId, Map<ModulePath, boolean>>();

    constructor(private collection: any) {}

    async loadAll() {
        const docs = await this.collection.find().toArray();

        for (const doc of docs) {
            const map = new Map<ModulePath, boolean>();
            if (doc.enabled) {
                Object.entries(doc.enabled).forEach(([path, isEnabled]) => {
                    map.set(path, isEnabled as boolean);
                });
            } else {
                Object.entries(!doc.enabled).forEach(([path, isEnabled]) => {
                    map.set(path, isEnabled as boolean);
                });
            }
            this.cache.set(doc._id, map);
        }
    }

    getModulesList(guildId: string): any[] {
        return modules.map((value) => {
            const mod = { ...value };
            
            mod.enabled = this.cache.get(guildId)?.get(value.pathname) ?? value.enabled;
            
            return mod;
        });
    }

    isEnabled(guildId: GuildId, modulePath: ModulePath): boolean {
        // console.log(this.cache.get(guildId)?.get(modulePath) ?? false)
        for (const mod of modules) {
            if (mod.pathname !== modulePath) {
                return this.cache.get(guildId)?.get(modulePath) ?? mod.enabled;
            }
        }

        return this.cache.get(guildId)?.get(modulePath) ?? false;
    }

    async set(
        guildId: GuildId,
        modulePath: ModulePath,
        enabled: boolean
    ) {
        if (!this.cache.has(guildId)) {
            this.cache.set(guildId, new Map());
        }

        this.cache.get(guildId)!.set(modulePath, enabled);

        await this.collection.updateOne(
            { _id: guildId },
            {
                $set: {
                    [`enabled.${modulePath}`]: enabled,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
    }
}

export const collection = mongo.db("DashboardBot").collection("Modules");
export const moduleManager = new ModuleManager(collection);