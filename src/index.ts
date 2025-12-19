import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { ShardingManager } from "discord.js";
import { type Logger } from "pino";
import { isDev, shardingMode, shardsCount } from "./config/index.js";
import { createLogger } from "./utils/functions/createLogger.js";

const log: Logger = createLogger({
    name: "ShardManager",
    type: "manager",
    dev: isDev,
});

const manager: ShardingManager = new ShardingManager(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "bot.js"),
    {
        totalShards: shardsCount,
        respawn: true,
        token: process.env.DISCORD_TOKEN,
        mode: shardingMode,
    },
);

try {
    await manager
        .on("shardCreate", (shard) => {
            log.info(`Shard #${shard.id} has spawned.`);
            shard
                .on("disconnect", () => log.warn({ shardId: shard.id }, "SHARD_DISCONNECTED"))
                .on("reconnecting", () => log.info({ shardId: shard.id }, "SHARD_RECONNECTING"));
            if (manager.shards.size === manager.totalShards) {
                log.info("All shards are spawned successfully.");
            }
        })
        .spawn();
} catch (error) {
    log.error({ err: error }, "Error spawning shards");
}
