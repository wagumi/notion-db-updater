import fs from "fs";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { setTimeout } from "timers/promises";
import { program } from "commander";
import { createRequire } from "module";
import { CONSTANTS, sleep } from "./common/common.js";
import { setOptions, getModes } from "./common/options.js";
import {
  notionCreate,
  notionUpdate,
  notionQuery,
} from "./common/connectNotion.js";
dotenv.config();

program
  .option(
    "-m, --mode <optionValue>",
    `set mode [${getModes().join(",")}]`,
    "default"
  )
  .option("-v, --verbose", "verbose", false)
  .option("-s, --start", "direct start", false)
  .option("-l, --limit <optionValue>", "set limit", 0)
  .option("-f, --from <optionValue>", "set from", 0)
  .option("-t, --to <optionValue>", "set to", 0);
program.parse();
const options = program.opts();

let json = [];
let targetTo = 0;
let targetFrom = 0;
let addCnt = 0;
let updateCnt = 0;
let exitCnt = 0;
let workingId = 0;
let failedList = [];

const roles = CONSTANTS.roles;

const setOption = () => {
  const result = setOptions(options);
  targetFrom = result.from;
  targetTo = result.to;
  return result.result;
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
            (member_n.icon === members_discord[i].icon ||
              member_n.icon === CONSTANTS.DISCORD_DUMMY_ICON) &&
            member_n.exit === false
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
    if (!result && !members_notion[i].exit) {
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
  console.log(`UPDATE: ${workingId} ${member.id} ${member.name}`);

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
        member.icon.length <= 100 ? member.icon : CONSTANTS.DISCORD_DUMMY_ICON,
      type: "external",
      external: {
        url:
          member.icon.length <= 100
            ? member.icon
            : CONSTANTS.DISCORD_DUMMY_ICON,
      },
    });
  }
  const update = await notionUpdate({
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
      Exit: {
        checkbox: false,
      },
    },
  });

  if (!update) {
    failedList.push(workingId);
    console.log(`UPDATE失敗: ${workingId} ${member.id} ${member.name}`);
  }
}

async function addMember(member) {
  addCnt++;
  if (options.mode == "addSkip") {
    console.log(`ADD: ${workingId} ${member.id} ${member.name} (mode:addSkip)`);
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
        member.icon.length <= 100 ? member.icon : CONSTANTS.DISCORD_DUMMY_ICON,
      type: "external",
      external: {
        url:
          member.icon.length <= 100
            ? member.icon
            : CONSTANTS.DISCORD_DUMMY_ICON,
      },
    });
  }
  const response = await notionCreate({
    parent: {
      database_id: CONSTANTS.NOTION_DATABASE_ID,
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
  if (!response) {
    console.log(`ADD 失敗: ${workingId} ${member.id} ${member.name}`);
    failedList.push(workingId);
  }
}

async function createDiscordMembersJson(nextid = null) {
  let endpoint = `https://discord.com/api/v10/guilds/${CONSTANTS.DISCORD_GUILD_ID}/members?limit=1000`;
  if (nextid) {
    endpoint = `https://discord.com/api/v10/guilds/${CONSTANTS.DISCORD_GUILD_ID}/members?limit=1000&after=${nextid}`;
  }

  const response = await fetch(endpoint, {
    headers: {
      accept: "*/*",
      "User-Agent": "WagumiDiscordBot (https://wagumi.xyz/dev/discord/,1.0.0)",
      "accept-language": "ja,en-US;q=0.9,en;q=0.8",
      authorization: `Bot ${CONSTANTS.DISCORD_BOT_KEY}`,
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
      member.icon = `https://cdn.discordapp.com/guilds/${CONSTANTS.DISCORD_GUILD_ID}/users/${data.user.id}/avatars/${data.avatar}.png`;
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
  const request = { database_id: CONSTANTS.NOTION_DATABASE_ID };

  if (next_cursor) {
    request.start_cursor = next_cursor;
  }

  const response = await notionQuery(request);

  const members = response.results.map((data) => {
    // console.log(JSON.stringify(data, null, 2));
    const member = {};
    if (data.properties.id.rich_text.length > 0) {
      member.id = data.properties.id.rich_text[0].plain_text;
      member.name = data.properties.name.title[0].plain_text;
      member.roles = data.properties.roles.multi_select.map((role) => {
        return role.name;
      });
      member.icon = "";
      if (data.properties.icon.files[0]) {
        member.icon = data.properties.icon.files[0].external.url;
      }
      member.exit = data.properties.Exit.checkbox;
      member.page_id = data.id;

      if (options.verbose) {
        console.log(
          "notion data memberid:" + member.id + "(" + member.name + ")"
        );
      }
    } else {
      console.log("Can't get ID:" + JSON.stringify(data.id, null, 2));
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
  const request = { database_id: CONSTANTS.NOTION_DATABASE_ID };
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

  const response = await notionQuery(request);
  if (response) {
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
  } else {
    failedList.push(workingId);
    return false;
  }
}

async function setExit(member) {
  exitCnt++;
  console.log(`Exit: ${member.id} ${member.name} ${member.page_id}`);

  const request = { page_id: member.page_id };
  request.properties = { Exit: { checkbox: true } };

  const response = await notionUpdate(request);
  if (!response) {
    console.log(`Exit失敗: ${member.id} ${member.name} ${member.page_id}`);
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
