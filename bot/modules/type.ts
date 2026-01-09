import type { ChatInputCommandInteraction, Client, ClientEvents, SlashCommandBuilder } from "discord.js";

export interface ModuleEvent<K extends keyof ClientEvents> {
    name: K;
    once?: boolean;
    execute: (client: Client, ...args: ClientEvents[K]) => Promise<void> | void;
}

export interface ModuleType {
    name: string,
    pathname: string,
    description: string,
    enabled: boolean,
    commands?: {
        data: SlashCommandBuilder | any;
        execute: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
    }[];
    events?: ModuleEvent<any>[];
    emoji: string;
}