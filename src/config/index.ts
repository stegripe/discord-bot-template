import path from "node:path";
import { fileURLToPath } from "node:url";
import { ActivityType, type ClientOptions, IntentsBitField, Options } from "discord.js";
import { prefix } from "./env.js";

const rootDir: string = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const clientOptions: ClientOptions & {
    loadMessageCommandListeners: boolean;
    defaultPrefix: string;
    baseUserDirectory: string;
} = {
    presence: {
        status: "dnd",
        activities: [{ name: "Loading...", type: ActivityType.Playing }],
    },
    intents: [
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.Guilds,
    ],
    makeCache: Options.cacheWithLimits({
        ...Options.DefaultSweeperSettings,
        ThreadManager: {
            maxSize: Number.POSITIVE_INFINITY,
        },
    }),
    sweepers: {
        ...Options.DefaultSweeperSettings,
        threads: {
            interval: 300,
            lifetime: 10_800,
        },
    },
    loadMessageCommandListeners: true,
    defaultPrefix: prefix,
    baseUserDirectory: rootDir,
};

export * from "./constants.js";
export * from "./env.js";
