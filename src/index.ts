import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { ShardingManager } from "discord.js";
import pino, { type Logger } from "pino";
import { enableSharding, isDev } from "./config/index.js";

const log: Logger = pino({
    name: "ShardManager",
    timestamp: true,
    level: isDev ? "debug" : "info",
    formatters: {
        bindings: () => ({ pid: "Manager" }),
    },
});

if (enableSharding) {
    const manager: ShardingManager = new ShardingManager(
        path.resolve(path.dirname(fileURLToPath(import.meta.url)), "bot.js"),
        {
            totalShards: "auto",
            respawn: true,
            token: process.env.DISCORD_TOKEN,
            mode: "worker",
        },
    );

    try {
        await manager
            .on("shardCreate", (shard) => {
                log.info(`Shard #${shard.id} has spawned.`);
                shard
                    .on("disconnect", () => log.warn({ shardId: shard.id }, "SHARD_DISCONNECTED"))
                    .on("reconnecting", () =>
                        log.info({ shardId: shard.id }, "SHARD_RECONNECTING"),
                    );
                if (manager.shards.size === manager.totalShards) {
                    log.info("All shards are spawned successfully.");
                }
            })
            .spawn();
    } catch (error) {
        log.error({ err: error }, "Error spawning shards");
    }
} else {
    log.info("Sharding disabled, starting bot directly...");
    await import("./bot.js");
}
