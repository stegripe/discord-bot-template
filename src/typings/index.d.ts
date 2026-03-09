import { type ActivityOptions, type ClientPresenceStatus } from "discord.js";
import type * as config from "../config/index.js";
import type { MessageResponseTracker } from "../utils/MessageResponseTracker.js";

export type PresenceData = {
    activities: ActivityOptions[];
    status: ClientPresenceStatus[];
    interval: number;
};

declare module "@sapphire/framework" {
    interface Container {
        config: typeof config;
        messageResponseTracker: MessageResponseTracker;
    }
}
