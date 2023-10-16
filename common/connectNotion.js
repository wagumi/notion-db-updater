import Notion from "@notionhq/client";
import dotenv from "dotenv";
import { CONSTANTS, sleep, randomInt } from "./common.js";
dotenv.config();

const client = new Notion.Client({
  auth: CONSTANTS.NOTION_API_KEY,
});

const notionUpdate = async function (request, retryCount = 0) {
  let response;
  try {
    response = await client.pages.update(request);
  } catch (e) {
    retryCount++;
    if (retryCount > CONSTANTS.RETRY_LIMIT) {
      console.log("update failed");
      return false;
    }
    console.log("update retry:" + retryCount);
    sleep(CONSTANTS.RETRY_WAIT);
    response = await notionUpdate(request, retryCount);
  }
  return response;
};

const notionCreate = async function (request, retryCount = 0) {
  let response;
  try {
    response = await client.pages.create(request);
  } catch (e) {
    retryCount++;
    if (retryCount > CONSTANTS.RETRY_LIMIT) {
      console.log("create failed");
      return false;
    }
    console.log("create retry:" + retryCount);
    sleep(CONSTANTS.RETRY_WAIT);
    response = await notionCreate(request, retryCount);
  }
  return response;
};

const notionQuery = async function (request, retryCount = 0) {
  let response;
  try {
    response = await client.databases.query(request);
  } catch (e) {
    retryCount++;
    if (retryCount > CONSTANTS.RETRY_LIMIT) {
      console.log("fetch failed");
      return false;
    }
    console.log("fetch retry:" + retryCount);
    sleep(CONSTANTS.RETRY_WAIT);
    response = await notionQuery(request, retryCount);
  }
  return response;
};

export { notionQuery, notionCreate, notionUpdate };
