import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const homeDir = os.homedir();
const storeDir = "twitch-alert";
const storeName = "store.json";
const storePath = path.join(homeDir, storeDir, storeName);

/**
 * {
 *  [commandName]: {
 *    [storeKey]: {
 *
 *    }
 *  }
 * }
 *
 */

export type SavedData = {
  [commandName: string]: {
    [storeName: string]: unknown;
  };
};

export async function readConfig(): Promise<SavedData> {
  try {
    const jsonString = await fs.readFile(storePath, "utf8");
    const parsedJson = JSON.parse(jsonString);
    console.log("Read json:", jsonString);
    return parsedJson || {};
  } catch (e) {
    console.error("Failed to read json!", e);
    return {};
  }
}

export async function writeConfig(obj: SavedData) {
  try {
    await fs.mkdir(path.join(homeDir, storeDir), { recursive: true });
    const jsonString = JSON.stringify(obj, null, 4);
    await fs.writeFile(storePath, jsonString);
    console.log("Wrote json:", jsonString);
  } catch (e) {
    console.error("Failed to write json store", e);
  }
}

const jsonStore = await readConfig();

export const getCommandData = (commandName: string) => {
  return jsonStore[commandName];
};
