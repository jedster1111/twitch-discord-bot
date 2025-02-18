import fs from "node:fs/promises"
import path from "node:path";
import os from "node:os"

const homeDir = os.homedir();
const storeDir = "twitch-alert";
const storeName = "store.json"
const storePath = path.join(homeDir, storeDir, storeName);

console.log("Current user is", os.userInfo().username);

export async function loadStore() {
  try {
    const json = JSON.parse(await fs.readFile(storePath, 'utf8'));
    console.log("Read json:", json)
    return json
  } catch (e) {
    console.error("Failed to read json!", e)
  }
}

export async function writeStore() {
  try {
    await fs.mkdir(path.join(homeDir, storeDir), { recursive: true })
    console.log("Wrote json")
    const inputObj = { testKey: "testValue" };
    return await fs.writeFile(storePath, JSON.stringify(inputObj))
  } catch (e) {
    console.error("Failed to write json store", e)
  }
}
