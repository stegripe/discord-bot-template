import process from "node:process";
import { type UserResolvable } from "discord.js";

export const defaultPrefix = "!";
export const defaultDevs: UserResolvable[] = ["319872685897416725", "366169273485361153"];
export const enableSharding: boolean = process.env.ENABLE_SHARDING !== "no";
