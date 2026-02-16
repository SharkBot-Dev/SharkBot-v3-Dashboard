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
            if (doc.enabled && typeof doc.enabled === 'object') {
                Object.entries(doc.enabled).forEach(([path, isEnabled]) => {
                    map.set(path, isEnabled as boolean);
                });
            }
            this.cache.set(doc._id, map);
        }
    }

    getModulesList(guildId: string): any[] {
        return modules.map((value) => ({
            ...value,
            enabled: this.cache.get(guildId)?.get(value.pathname) ?? value.enabled
        }));
    }

    isEnabled(guildId: GuildId, modulePath: ModulePath): boolean {
        const cachedValue = this.cache.get(guildId)?.get(modulePath);
        if (cachedValue !== undefined) return cachedValue;

        const defaultMod = modules.find(m => m.pathname === modulePath);
        return defaultMod?.enabled ?? false;
    }

    async set(guildId: GuildId, modulePath: ModulePath, enabled: boolean) {
        if (!this.cache.has(guildId)) {
            this.cache.set(guildId, new Map());
        }

        this.cache.get(guildId)!.set(modulePath, enabled);

        await this.collection.updateOne(
            { _id: guildId },
            {
                $set: {
                    [`enabled.${modulePath.replace(/\./g, '_')}`]: enabled,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
    }
}

export const collection = mongo.db("DashboardBot").collection("Modules");
export const moduleManager = new ModuleManager(collection);