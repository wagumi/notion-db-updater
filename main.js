const fs = require("fs");
const fetch = require("node-fetch");
const Notion = require("@notionhq/client");
require("dotenv").config();

// NOTION MEMBERS DBへの読み取り/書き込み権限を有するAPI-KEY
const NOTION_API_KEY = process.env.NOTION_API_KEY;

// Discordサーバーのユーザー情報読み取り権限を有するBOT-TOKEN
const DISCORD_BOT_KEY = process.env.DISCORD_BOT_KEY;

const client = new Notion.Client({
    auth: NOTION_API_KEY,
});

let json = [];

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

const start = async () => {
    const members_notion = require("./json/MEMBERS_NOTION.json");
    const members_discord = require("./json/MEMBERS_DISCORD.json");

    for (let i = 0; i < members_discord.length; i++) {
        const result = members_notion.find(
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
        if (!result) {
            try {
                await updateMember(members_discord[i]);
            } catch (e) {
                console.log(e);
            }
        }
    }

    for (let i = 0; i < members_discord.length; i++) {
        const result = members_notion.find(
            (member_n) => member_n.id === members_discord[i].id
        );
        if (!result) {
            console.log("ADD", members_discord[i]);
            try {
                await addMember(members_discord[i]);
            } catch (e) {
                console.log(e);
            }
        }
    }

    for (let i = 0; i < members_notion.length; i++) {
        const result = members_discord.find(
            (member) => member.id === members_notion[i].id
        );
        if (!result) {
            console.log("EXIT", members_notion[i]);
            await setExit(members_notion[i].page_id);
        }
    }
};

async function updateMember(member) {
    const page = await getMembers(member.id);
    if (!page) {
        console.log(member.id);
        return;
    }
    console.log(member);

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
    const update = await client.pages.update({
        page_id: page.id,
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
    //console.log(update);
}

async function addMember(member) {
    const page = await getMembers(member.id);
    if (page) {
        console.log(`${member.id} ${member.username} is already registered`);
        return;
    }
    //console.log(member);

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
    const response = await client.pages.create({
        parent: {
            database_id: "4389eeef-9d7f-43bc-a848-3d47c016a764",
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
}

async function createDiscordMembersJson(nextid = null) {
    let endpoint =
        "https://discord.com/api/v10/guilds/914960638365810748/members?limit=1000";
    if (nextid) {
        endpoint = `https://discord.com/api/v10/guilds/914960638365810748/members?limit=1000&after=${nextid}`;
    }

    const response = await fetch(endpoint, {
        headers: {
            accept: "*/*",
            "User-Agent":
                "WagumiDiscordBot (https://wagumi.xyz/dev/discord/,1.0.0)",
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
            member.icon = `https://cdn.discordapp.com/guilds/914960638365810748/users/${data.user.id}/avatars/${data.avatar}.png`;
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
            const { setTimeout } = require("timers/promises");
            console.log("set timeout", headers.get("x-ratelimit-reset-after"));
            await setTimeout(headers.get("x-ratelimit-reset-after") * 1100);
        }
        console.log(result[1000 - 1].user.id);
        await createDiscordMembersJson(result[1000 - 1].user.id);
    }
}

async function createNotionMembersJson(next_cursor = null) {
    const request = { database_id: "4389eeef-9d7f-43bc-a848-3d47c016a764" };

    if (next_cursor) {
        request.start_cursor = next_cursor;
    }

    const response = await client.databases.query(request);
    const members = response.results.map((data) => {
        //console.log(JSON.stringify(data,null,2));
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
        console.log(member);
        return member;
    });
    json = json.concat(members);
    if (response.has_more) {
        console.log(json.length);
        await createNotionMembersJson(response.next_cursor);
    }
}

async function getMembers(userid = null, next_cursor = null) {
    const request = { database_id: "4389eeef-9d7f-43bc-a848-3d47c016a764" };
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
}

async function setExit(pageid) {
    const request = { page_id: pageid };
    request.properties = { Exit: { checkbox: true } };
    const response = await client.pages.update(request);
}

(async () => {
    console.log("start");

    if (!fs.existsSync("./json")) {
        fs.mkdirSync("./json");
        console.log("Created json folder");
    }

    json = [];
    await createNotionMembersJson();
    fs.writeFileSync(
        "./json/MEMBERS_NOTION.json",
        JSON.stringify(json, null, 2)
    );
    console.log(`${json.length}件を出力`);

    json = [];
    await createDiscordMembersJson();
    fs.writeFileSync(
        "./json/MEMBERS_DISCORD.json",
        JSON.stringify(json, null, 2)
    );
    console.log(`${json.length}件を出力`);

    await start();
})();
