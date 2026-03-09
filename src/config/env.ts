import process from "node:process";
import { ActivityType, type ColorResolvable } from "discord.js";
import type { PresenceData } from "../typings/index.js";
import { defaultDevs, defaultPrefix } from "./constants.js";

export const isDev: boolean = process.env.NODE_ENV === "development";
export const enableSlashCommand: boolean = process.env.ENABLE_SLASH_COMMAND !== "no";

const envPrefix = process.env.PREFIX?.trim();
export const prefix: string = envPrefix || (isDev ? "d!" : defaultPrefix);

const envDevs: string[] =
    process.env.DEVS?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
export const devs: string[] = envDevs.length > 0 ? envDevs : (defaultDevs as string[]);

export const devGuild: string[] =
    process.env.DEV_GUILD?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [];

export const embedColor = (() => {
    const envColor = process.env.EMBED_COLOR?.trim();
    return (envColor ? `#${envColor.replace("#", "")}` : "#3FC4FF") as ColorResolvable;
})();

export const presenceData: PresenceData = {
    activities: [
        { name: `my prefix is ${prefix}`, type: ActivityType.Playing },
        { name: "with {userCount} users", type: ActivityType.Playing },
        {
            name: "{textChannelCount} of text channels in {guildCount} guilds",
            type: ActivityType.Watching,
        },
    ],
    interval: 60_000,
    status: ["online"],
};
