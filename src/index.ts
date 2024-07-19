import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { ShardingManager } from "discord.js";
import { isDev, shardingMode, shardsCount } from "./config/index.js";
import { createLogger } from "./utils/functions/createLogger.js";

const log = createLogger({
    name: "ShardManager",
    type: "manager",
    dev: isDev
});

const manager = new ShardingManager(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "bot.js"), {
    totalShards: shardsCount,
    respawn: true,
    token: process.env.DISCORD_TOKEN,
    mode: shardingMode
});

try {
    await manager.on("shardCreate", shard => {
        log.info(`Shard #${shard.id} has spawned.`);
        shard.on("disconnect", () => log.warn("SHARD_DISCONNECTED: ", { stack: `Shard #${shard.id} has disconnected.` }))
            .on("reconnecting", () => log.info("SHARD_RECONNECTING: ", { stack: `Shard #${shard.id} is reconnecting.` }));
        if (manager.shards.size === manager.totalShards) log.info("All shards are spawned successfully.");
    }).spawn();
} catch (error) {
    log.error(error);
}
