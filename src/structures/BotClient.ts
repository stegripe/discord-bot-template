import process from "node:process";
import { container, SapphireClient } from "@sapphire/framework";
import { PinoLogger } from "@stegripe/pino-logger";
import { type ClientOptions } from "discord.js";
import * as config from "../config/index.js";
import { messageResponseTracker } from "../utils/index.js";

export class BotClient extends SapphireClient {
    public readonly config = config;

    public constructor(
        clientOptions: ClientOptions & {
            loadMessageCommandListeners?: boolean;
            defaultPrefix?: string;
            baseUserDirectory?: string;
        },
    ) {
        super({
            ...clientOptions,
            logger: {
                instance: new PinoLogger({
                    name: "bot",
                    timestamp: true,
                    level: config.isDev ? "debug" : "info",
                    formatters: {
                        bindings: () => ({ pid: `Bot@${process.pid}` }),
                    },
                }),
            },
        });

        container.config = config;
        container.messageResponseTracker = messageResponseTracker;
    }

    public override async login(token?: string): Promise<string> {
        return super.login(token);
    }
}
