import fs from "fs";
import fetch from "node-fetch";
import Notion from "@notionhq/client";
import dotenv from "dotenv";
import { setTimeout } from "timers/promises";
import { program } from "commander";
import { createRequire } from "module";
dotenv.config();

const modes = [
  "discordOnly",
  "notionOnly",
  "fetchOnly",
  "addSkip",
  "updateSkip",
];

//"set mode [discordOnly,notionOnly,fetchOnly,addSkip,updateSkip]",
program
  .option(
    "-m, --mode <optionValue>",
    `set mode [${modes.join(",")}]`,
    "default"
  )
  .option("-w, --waitTime <optionValue>", "set waitTime [msec]", 0)
  .option("-v, --verbose", "verbose", false)
  .option("-s, --start", "direct start", false)
  .option("-d, --dryRun", "dry run", false)
  .option("-l, --limit <optionValue>", "set limit", 0)
  .option("-f, --from <optionValue>", "set from", 0)
  .option("-t, --to <optionValue>", "set to", 0);
program.parse();
const options = program.opts();

// NOTION MEMBERS DBへの読み取り/書き込み権限を有するAPI-KEY/DATABASE_ID
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Discordサーバーのユーザー情報読み取り権限を有するBOT-TOKEN/GUILD_ID
const DISCORD_BOT_KEY = process.env.DISCORD_BOT_KEY;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

const client = new Notion.Client({
  auth: NOTION_API_KEY,
});

let json = [];
let targetTo = 0;
let targetFrom = 0;
let targetLimit = 0;
let addCnt = 0;
let updateCnt = 0;
let exitCnt = 0;
let workingId = 0;
let failedList = [];

const roles = {
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
};

const setOption = () => {
  if (options.mode != "default" && modes.indexOf(options.mode) === -1) {
    console.log("invalid mode: " + options.mode);
    return false;
  }
  if (options.mode != "default") {
    console.log(options.mode + " mode");
  }
  targetFrom = parseInt(options.from);
  targetTo = parseInt(options.to);
  targetLimit = parseInt(options.limit);
  if (targetLimit > 0 && targetTo == 0 && targetFrom == 0) {
    targetFrom = 0;
    targetTo = targetLimit;
  } else if (targetLimit == 0 && targetTo == 0 && targetFrom > 0) {
    targetTo = targetFrom;
  } else if (targetTo == 0 && targetLimit > 0) {
    targetTo = targetFrom + targetLimit - 1;
  } else if (targetTo - targetFrom < 0) {
    targetTo = NaN;
  } else if (targetLimit != 0 && targetTo - targetFrom > targetLimit) {
    targetTo = targetFrom + targetLimit - 1;
  }

  if (isNaN(targetTo)) {
    console.log(
      `oprion error from:${options.from} from:${options.from} limit:${options.limit}`
    );
    return false;
  }

  if (targetTo > 0) {
    console.log("from:" + targetFrom + " to:" + targetTo);
  }
  return true;
};

const sleep = (waitTime) => {
  if (waitTime < 1) {
    return;
  }
  console.log(`sleep ${waitTime} msec`);
  const startTime = Date.now();
  while (Date.now() - startTime < waitTime);
};

const start = async () => {
  const require = createRequire(import.meta.url);
  const members_notion = require("./json/MEMBERS_NOTION.json");
  const members_discord = require("./json/MEMBERS_DISCORD.json");

  for (let i = 0; i < members_discord.length; i++) {
    workingId = i;
    if (
      (targetFrom == 0 && targetTo == 0) ||
      (i >= targetFrom && i <= targetTo)
    ) {
      const notionPage = members_notion.find(
        (member) => member.id === members_discord[i].id
      );

      if (notionPage) {
        const updateCheck = members_notion.find(
          (member_n) =>
            member_n.id === members_discord[i].id &&
            member_n.name === members_discord[i].name &&
            member_n.roles.filter(
              (data) => members_discord[i].roles.indexOf(data) === -1
            ).length === 0 &&
            members_discord[i].roles.filter(
              (data) => member_n.roles.indexOf(data) === -1
            ).length === 0 &&
            member_n.icon === members_discord[i].icon
          //&& false
        );
        if (!updateCheck) {
          await updateMember(members_discord[i], notionPage.page_id);
        } else {
          if (options.verbose) {
            console.log(
              `STAY: ${workingId} ${members_discord[i].id} ${members_discord[i].name}`
            );
          }
        }
      } else {
        await addMember(members_discord[i]);
      }
    }
  }

  for (let i = 0; i < members_notion.length; i++) {
    const result = members_discord.find(
      (member) => member.id === members_notion[i].id
    );
    if (!result) {
      await setExit(members_notion[i]);
    }
  }

  console.log("add " + addCnt);
  console.log("update " + updateCnt);
  console.log("exit " + exitCnt);
  if (failedList.length > 0) {
    console.log("failedList");
    console.dir(failedList);
  }
};

async function updateMember(member, page_id) {
  updateCnt++;
  if (options.mode == "updateSkip") {
    console.log(
      `UPDATE: ${workingId} ${member.id} ${member.name} (mode:updateSkip)`
    );
    return;
  }
  if (options.dryRun) {
    console.log(`UPDATE: ${workingId} ${member.id} ${member.name} (dry run)`);
    return;
  }
  console.log(`UPDATE: ${workingId} ${member.id} ${member.name}`);
  sleep(options.waitTime);

  const roles = [];
  for (let i = 0; i < member.roles.length; i++) {
    if (member.roles[i]) {
      roles.push({ name: member.roles[i] });
    }
  }

  const icon = [];
  if (member.icon) {
    icon.push({
      name:
        member.icon.length <= 100
          ? member.icon
          : "https://discord.com/assets/2d20a45d79110dc5bf947137e9d99b66.svg",
      type: "external",
      external: {
        url:
          member.icon.length <= 100
            ? member.icon
            : "https://discord.com/assets/2d20a45d79110dc5bf947137e9d99b66.svg",
      },
    });
  }
  try {
    const update = await client.pages.update({
      page_id: page_id,
      icon: {
        type: "external",
        external: {
          url: member.icon,
        },
      },
      properties: {
        name: {
          title: [{ text: { content: member.name } }],
        },
        roles: {
          multi_select: roles,
        },
        join: {
          date: {
            start: member.join,
          },
        },
        id: {
          rich_text: [{ text: { content: member.id } }],
        },
        icon: {
          files: icon,
        },
      },
    });
  } catch (e) {
    console.log("message" + e.message);
    console.log("status:" + e.code);
    failedList.push(workingId);
  }
  //console.log(update);
}

async function addMember(member) {
  addCnt++;
  if (options.mode == "addSkip") {
    console.log(`ADD: ${workingId} ${member.id} ${member.name} (mode:addSkip)`);
    return;
  }
  if (options.dryRun) {
    console.log(`ADD: ${workingId} ${member.id} ${member.name} (dry run)`);
    return;
  }

  const page = await getMembers(member.id);
  if (page) {
    console.log(
      `ADD: ${workingId} ${member.id} ${member.name} is already registered`
    );
    return;
  }

  console.log(`ADD: ${workingId} ${member.id} ${member.name}`);
  sleep(options.waitTime);

  const roles = [];
  for (let i = 0; i < member.roles.length; i++) {
    if (member.roles[i]) {
      roles.push({ name: member.roles[i] });
    }
  }
  const icon = [];
  if (member.icon) {
    icon.push({
      name:
        member.icon.length <= 100
          ? member.icon
          : "https://discord.com/assets/2d20a45d79110dc5bf947137e9d99b66.svg",
      type: "external",
      external: {
        url:
          member.icon.length <= 100
            ? member.icon
            : "https://discord.com/assets/2d20a45d79110dc5bf947137e9d99b66.svg",
      },
    });
  }
  try {
    const response = await client.pages.create({
      parent: {
        database_id: process.env.NOTION_DATABASE_ID,
      },
      icon: {
        type: "external",
        external: {
          url: member.icon,
        },
      },
      properties: {
        name: {
          title: [{ text: { content: member.name } }],
        },
        id: {
          rich_text: [{ text: { content: member.id } }],
        },
        icon: {
          files: icon,
        },
        roles: {
          multi_select: roles,
        },
        join: {
          date: {
            start: member.join,
          },
        },
      },
    });
  } catch (e) {
    console.log("message" + e.message);
    console.log("status:" + e.code);
    failedList.push(workingId);
  }
}

async function createDiscordMembersJson(nextid = null) {
  let endpoint = `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members?limit=1000`;
  if (nextid) {
    endpoint = `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members?limit=1000&after=${nextid}`;
  }

  const response = await fetch(endpoint, {
    headers: {
      accept: "*/*",
      "User-Agent": "WagumiDiscordBot (https://wagumi.xyz/dev/discord/,1.0.0)",
      "accept-language": "ja,en-US;q=0.9,en;q=0.8",
      authorization: `Bot ${DISCORD_BOT_KEY}`,
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
      "x-discord-locale": "ja",
    },
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  });

  const members = [];
  const result = await response.json();
  for (let i = 0; i < result.length; i++) {
    const data = result[i];
    if (data.user.bot) {
      continue;
    }

    const member = {};

    member.id = data.user.id;

    if (data.nick) {
      member.name = data.nick;
    } else {
      member.name = data.user.username;
    }

    member.roles = [];
    for (let i = 0; i < data.roles.length; i++) {
      if (roles[data.roles[i]]) {
        member.roles.push(roles[data.roles[i]]);
      }
    }

    if (data.avatar) {
      member.icon = `https://cdn.discordapp.com/guilds/${DISCORD_GUILD_ID}/users/${data.user.id}/avatars/${data.avatar}.png`;
    } else if (data.user.avatar) {
      member.icon = `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png`;
    } else {
      member.icon =
        "https://discord.com/assets/f9bb9c4af2b9c32a2c5ee0014661546d.png";
    }

    member.join = data.joined_at;
    json.push(member);
  }

  if (result.length === 1000) {
    const headers = await response.headers;
    if (headers.get("x-ratelimit-remaining") <= 1) {
      //const { setTimeout } = require("timers/promises");
      console.log("set timeout", headers.get("x-ratelimit-reset-after"));
      await setTimeout(headers.get("x-ratelimit-reset-after") * 1100);
    }
    console.log(result[1000 - 1].user.id);
    await createDiscordMembersJson(result[1000 - 1].user.id);
  }
}

async function createNotionMembersJson(next_cursor = null) {
  const request = { database_id: NOTION_DATABASE_ID };

  if (next_cursor) {
    request.start_cursor = next_cursor;
  }

  const response = await client.databases.query(request);

  const members = response.results.map((data) => {
    // console.log(JSON.stringify(data,null,2));
    const member = {};
    member.id = data.properties.id.rich_text[0].plain_text;
    member.name = data.properties.name.title[0].plain_text;
    member.roles = data.properties.roles.multi_select.map((role) => {
      return role.name;
    });
    member.icon = "";
    if (data.properties.icon.files[0]) {
      member.icon = data.properties.icon.files[0].external.url;
    }
    member.page_id = data.id;

    if (options.verbose) {
      console.log(
        "notion data memberid:" + member.id + "(" + member.name + ")"
      );
    }
    return member;
  });
  json = json.concat(members);
  if (response.has_more) {
    console.log(
      "notion data count: " + json.length + " next " + response.next_cursor
    );
    await createNotionMembersJson(response.next_cursor);
  }
}

async function getMembers(userid = null, next_cursor = null) {
  const request = { database_id: NOTION_DATABASE_ID };
  if (userid) {
    request.filter = {
      property: "id",
      rich_text: {
        equals: userid,
      },
    };
  }
  if (next_cursor) {
    request.start_cursor = next_cursor;
  }

  try {
    const response = await client.databases.query(request);
    const members = response.results.map((member) => {
      const pageid = member.id;
      const id = member.properties.id.rich_text[0].plain_text;
      const name = member.properties.name.title[0].plain_text;
      const roles = member.properties.roles.multi_select.map((role) => {
        return role.name;
      });
      return member;
    });

    if (response.has_more) {
      await getMembers(userid, response.next_cursor);
      return members[0];
    } else {
      return members[0];
    }
  } catch (e) {
    console.log("message" + e.message);
    console.log("status:" + e.code);
    failedList.push(workingId);
    return false;
  }
}

async function setExit(member) {
  exitCnt++;
  if (options.dryRun) {
    console.log(
      `Exit: ${member.id} ${member.name} ${member.page_id} (dry_run)`
    );
    return;
  }
  console.log(`Exit: ${member.id} ${member.name} ${member.page_id}`);

  const request = { page_id: member.page_id };
  request.properties = { Exit: { checkbox: true } };
  try {
    const response = await client.pages.update(request);
  } catch (e) {
    console.log(e);
  }
}

(async () => {
  if (!setOption()) {
    return;
  }

  if (!fs.existsSync("./json")) {
    fs.mkdirSync("./json");
    console.log("Created json folder");
  }

  if (!options.start) {
    if (options.mode != "discordOnly") {
      console.log(`fetch notion member`);
      json = [];
      try {
        await createNotionMembersJson();
      } catch (e) {
        console.log(e);
        throw e;
      }
      fs.writeFileSync(
        "./json/MEMBERS_NOTION.json",
        JSON.stringify(json, null, 2)
      );
      console.log(`notion member : ${json.length}`);
    }

    if (options.mode != "notionOnly") {
      console.log(`fetch discord member`);
      json = [];
      try {
        await createDiscordMembersJson();
      } catch (e) {
        console.log(e);
        throw e;
      }
      fs.writeFileSync(
        "./json/MEMBERS_DISCORD.json",
        JSON.stringify(json, null, 2)
      );
      console.log(`discord member : ${json.length}`);
    }
  }
  if (
    options.mode != "fetchOnly" &&
    options.mode != "discordOnly" &&
    options.mode != "notionOnly"
  ) {
    await start();
  }
})();
