import { Client, Colors, EmbedBuilder, Events, GuildMember, TextChannel, WebhookClient } from "discord.js";
import type { ModuleType } from "./../type.js";
import { mongo } from "../../../lib/mongo.js";
import { Long } from "mongodb";

const replaceTexts = (text: string, member: GuildMember): string => {
    const map: Record<string, string> = {
        "<name>": member.user.username,
        "<count>": member.guild.memberCount.toString(),
        "<guild>": member.guild.name,
        "<createdat>": member.user.createdAt.toLocaleDateString("ja-JP"),
    };
    return text.replace(/<name>|<count>|<guild>|<createdat>/g, (matched) => map[matched] as any);
};

export default {
    name: "ようこそモジュール",
    pathname: "welcome",
    emoji: "😉",
    description: "メンバー参加時に挨拶をします。",
    enabled: true,
    events: [
        {
            name: Events.GuildMemberAdd,
            execute: async (client: Client, member: GuildMember) => {
                if (!member.guild) return;

                const db = mongo.db("Main").collection("WelcomeMessage");
                const config = await db.findOne({
                    Guild: new Long(member.guild.id)
                });

                if (!config || !config.Channel) return;

                let webhookUrl = config.Webhook;

                let webhook: WebhookClient;
                try {
                    if (!webhookUrl) {
                        const channel = member.guild.channels.cache.get(config.Channel.toString()) as TextChannel;
                        if (!channel) return;

                        if (channel && channel.isTextBased() && !channel.isThread() && !channel.isVoiceBased()) {
                            try {
                                const newWebhook = await (channel as TextChannel).createWebhook({
                                    name: "SharkBot-Welcome",
                                    reason: "Welcome message module setup"
                                });
                                webhookUrl = newWebhook.url;

                                await db.updateOne(
                                    { Guild: new Long(member.guild.id) },
                                    { $set: { Webhook: webhookUrl } }
                                );
                            } catch (e) {
                                return;
                            }
                        } else {
                            return;
                        }
                    }
                    webhook = new WebhookClient({ url: webhookUrl });
                } catch (error) {
                    console.error("Webhookの作成または取得に失敗しました:", error);
                    await db.updateOne(
                        { Guild: new Long(member.guild.id) },
                        { $unset: { Webhook: "" } }
                    );
                    return;
                }

                try {
                    const title = config.Title ? replaceTexts(config.Title, member) : "Welcome!";
                    const description = config.Description ? replaceTexts(config.Description, member) : `<name> さん、**${member.guild.name}** へようこそ！`;

                    const embed = new EmbedBuilder()
                        .setTitle(title)
                        .setDescription(description)
                        .setColor(Colors.Green)
                        .setTimestamp();

                    const avatar = client.user?.displayAvatarURL();

                    await webhook.send({
                        embeds: [embed],
                        username: "SharkBot Welcome",
                        avatarURL: avatar as any
                    });
                } catch (error) {
                    console.error("メッセージ送信エラー:", error);
                } finally {
                    webhook.destroy();
                }
            }
        }
    ],
    commands: []
} as ModuleType;