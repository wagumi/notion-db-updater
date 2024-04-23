import dotenv from "dotenv";
dotenv.config();

export const sleep = (waitTime) => {
  if (waitTime < 1) {
    return;
  }
  const startTime = Date.now();
  while (Date.now() - startTime < waitTime);
};
export const randomInt = (max) => {
  return Math.floor(Math.random() * max);
};

export const CONSTANTS = {
  roles: {},
  // NOTION MEMBERS DBへの読み取り/書き込み権限を有するAPI-KEY/DATABASE_ID
  NOTION_API_KEY: process.env.NOTION_API_KEY,
  NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
  // Discordサーバーのユーザー情報読み取り権限を有するBOT-TOKEN/GUILD_ID
  DISCORD_BOT_KEY: process.env.DISCORD_BOT_KEY,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
  DISCORD_DUMMY_ICON:
    "https://discord.com/assets/2d20a45d79110dc5bf947137e9d99b66.svg",
  RETRY_LIMIT: 5,
  RETRY_WAIT: 500,
};
