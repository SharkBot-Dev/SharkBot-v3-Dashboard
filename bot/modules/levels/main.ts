import { ChatInputCommandInteraction, Client, Colors, EmbedBuilder, Events, Message, MessageFlags, SlashCommandBuilder, type Interaction } from "discord.js";
import type { ModuleType } from "./../type.js";
import { mongo } from "../../../lib/mongo.js";
import { Long } from "mongodb";
import { moduleManager } from "../../moduleManager.js";

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getRequiredXp = (level: number) => 5 * (level ** 2) + 50 * level + 100;

export default {
    name: "レベル",
    pathname: "levels",
    emoji: "🏆",
    description: "レベル機能をサーバーに追加します。",
    enabled: false,
    events: [
        {
            name: Events.MessageCreate,
            execute: async (client: any, message: Message) => {
                if (message.author.bot) return;
                if (!message.guild) return;

                if (!moduleManager.isEnabled(message.guild.id, "levels")) return;

                const db = mongo.db("DashboardBot").collection("Levels");
                const now = Date.now();
                const cooldown = 60000; 

                const userStats = await db.findOne({
                    guild_id: new Long(message.guild.id),
                    user_id: new Long(message.author.id)
                });

                if (!userStats) {
                    await db.insertOne({
                        guild_id: new Long(message.guild.id),
                        user_id: new Long(message.author.id),
                        xp: getRandomInt(15, 25),
                        level: 0,
                        last_xp_at: new Long(now)
                    });
                    return;
                }

                const lastXpAt = userStats.last_xp_at ? Number(userStats.last_xp_at) : 0;
                if (now - lastXpAt < cooldown) return;

                let { xp, level } = userStats;
                const xpToAdd = getRandomInt(15, 25);
                xp += xpToAdd;

                const neededXp = getRequiredXp(level);

                if (xp >= neededXp) {
                    level++;
                    xp -= neededXp; 

                    await message.reply(`GG ${message.author}, レベル **${level}** に上がったよ！`);
                }

                await db.updateOne(
                    { _id: userStats._id },
                    {
                        $set: { 
                            xp, 
                            level, 
                            last_xp_at: new Long(now) 
                        }
                    }
                );
            }
        }
    ],
    commands: [
        {
            data: new SlashCommandBuilder()
                .setName("rank")
                .setDescription("現在のレベルを表示します。")
                .addUserOption((op) => op.setName("user").setDescription("ユーザーを選択できます。")),
            execute: async (interaction: ChatInputCommandInteraction) => {
                if (interaction.member == null) return;
                if (interaction.channel == null) return;

                const user = interaction.options.getUser("user");
                await interaction.deferReply();

                const db = mongo.db("DashboardBot").collection("Levels");

                const userId = user?.id ?? interaction.user.id;
                const config = await db.findOne({
                    guild_id: new Long(interaction.guild?.id as string),
                    user_id: new Long(userId)
                });

                if (!config) {
                    await interaction.editReply("あなた・そのユーザーはまだレベルがありません。")
                    return;
                }

                const level = config.level;
                const xp = config.xp;

                const embed = new EmbedBuilder().setTitle(`${user?.username ?? interaction.user.username} のレベル`).setDescription(`レベル: ${level}\nXP: ${xp}`).setColor(Colors.Blue);
                embed.setThumbnail(user?.displayAvatarURL() ?? interaction.user.displayAvatarURL());

                await interaction.editReply({
                    embeds: [embed]
                })
            }
        }
    ]
} as ModuleType;