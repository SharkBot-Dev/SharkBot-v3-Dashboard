import { EmbedBuilder } from "discord.js";

export async function success_embed(title: string) {
    return new EmbedBuilder()
    .setAuthor({
        name: title,
        iconURL: "https://cdn.discordapp.com/emojis/1419898127975972937.png?format=webp&quality=lossless&width=85&height=81"
    }).setColor('Green')
}

export async function error_embed(title: string) {
    return new EmbedBuilder()
    .setAuthor({
        name: title,
        iconURL: "https://cdn.discordapp.com/emojis/1419898620530004140.png?format=webp&quality=lossless&width=84&height=79"
    }).setColor('Red')
}