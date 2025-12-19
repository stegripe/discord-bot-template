import { ActivityType, type ClientOptions, IntentsBitField, Options } from "discord.js";
import { type PresenceData } from "../typings/index.js";
import { prefix } from "./env.js";

export const clientOptions: ClientOptions = {
    intents: [
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.Guilds,
    ],
    makeCache: Options.cacheWithLimits({
        ...Options.DefaultSweeperSettings,
        // biome-ignore lint/style/useNamingConvention: Discord.js API naming convention
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
};

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

export * from "./constants.js";
export * from "./env.js";
