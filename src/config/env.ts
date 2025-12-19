import process from "node:process";
import { defaultPrefix } from "./constants.js";

export const enableSlashCommand: boolean = process.env.ENABLE_SLASH_COMMAND !== "no";
export const isDev: boolean = process.env.NODE_ENV === "development";
export const prefix: string = isDev ? "d-" : defaultPrefix;
