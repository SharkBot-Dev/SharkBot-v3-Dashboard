export function isGuildOwner(
  guildId: string,
  sessionGuilds: any[]
): boolean {
  const guild = sessionGuilds.find((g) => g.id === guildId);
  return guild?.owner === true;
}