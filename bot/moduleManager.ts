import { mongo } from "./../lib/mongo.js";

type GuildId = string;
type ModuleName = string;

export class ModuleManager {
    private cache = new Map<GuildId, Map<ModuleName, boolean>>();

    constructor(private collection: any) {}

    async loadAll() {
        const docs = await this.collection.find().toArray();

        for (const doc of docs) {
            const map = new Map(Object.entries(doc.enabled));
            this.cache.set(doc._id, map as any);
        }
    }

    isEnabled(guildId: GuildId, module: ModuleName): boolean {
        return this.cache.get(guildId)?.get(module) ?? false;
    }

    async set(
        guildId: GuildId,
        module: ModuleName,
        enabled: boolean
    ) {
        if (!this.cache.has(guildId)) {
            this.cache.set(guildId, new Map());
        }

            this.cache.get(guildId)!.set(module, enabled);

        await this.collection.updateOne(
            { _id: guildId },
            {
                $set: {
                    [`enabled.${module}`]: enabled,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
    }
}

export const collection = mongo.db("DashboardBot").collection("Modules");
export const moduleManager = new ModuleManager(collection);