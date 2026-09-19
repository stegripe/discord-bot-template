import process from "node:process";
import { type UserResolvable } from "discord.js";

export const defaultPrefix = "!";
export const defaultDevs: UserResolvable[] = ["956162927726063626", "366169273485361153"];
export const enableSharding: boolean = process.env.ENABLE_SHARDING !== "no";
