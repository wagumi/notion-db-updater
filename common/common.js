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
  roles: {
    "914960638365810749": "Admin",
    "915354258310832232": "Server Booster",
    "923625522485932112": "AMA",
    "923625906696769556": "Community",
    "923663531176493106": "Wagumi Cats",
    "924463951524290560": "AMA Leader",
    "924473090325504031": "Newsletter",
    "924464553683738665": "Newsletter Leader",
    "924464899562827797": "Community Leader",
    "924473090325504031": "Newsletter",
    "948119284637384744": "Investor",
    "1017617843916902411": "Wagumi SBT",
    "1054207962819858493": "Moderator",
    "1067826090611064842": "Product",
    "1085850046630744084": "Product Leader",
  },
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
