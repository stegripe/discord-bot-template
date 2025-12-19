import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client, type ShardClientUtil } from "discord.js";
import got from "got";
import * as config from "../config/index.js";
import { createLogger } from "../utils/functions/createLogger.js";
import { formatMS } from "../utils/functions/formatMS.js";
import { ClientUtils } from "../utils/structures/ClientUtils.js";
import { CommandManager } from "../utils/structures/CommandManager.js";
import { EventLoader } from "../utils/structures/EventLoader.js";

const basePath: string = path.dirname(fileURLToPath(import.meta.url));

export class BotClient extends Client {
    public readonly request = got;
    public readonly config = config;
    public readonly utils = new ClientUtils(this);
    public readonly commands = new CommandManager(this);
    public readonly events = new EventLoader(this);
    public readonly logger = createLogger({
        name: "bot",
        shardId: (this.shard as unknown as ShardClientUtil).ids[0],
        type: "shard",
        dev: this.config.isDev,
    });

    public async build(token?: string): Promise<this> {
        const start = Date.now();
        await this.events.readFromDir(path.resolve(basePath, "..", "events"));
        const listener = (): void => {
            void this.commands.readFromDir(path.resolve(basePath, "..", "commands"));
            this.logger.info(`Ready in ${formatMS(Date.now() - start)}.`);

            this.removeAllListeners("ready");
        };

        this.on("ready", listener);
        await this.login(token);
        return this;
    }
}
