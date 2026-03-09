import process from "node:process";
import { ApplicationCommandRegistries, container, RegisterBehavior } from "@sapphire/framework";
import { clientOptions } from "./config/index.js";
import { BotClient } from "./structures/BotClient.js";

const client: BotClient = new BotClient(clientOptions);

async function gracefulShutdown(signal: string): Promise<void> {
    container.logger.info(`Received ${signal}, shutting down gracefully...`);
    client.destroy();
    process.exit(0);
}

process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("exit", (code) => {
    container.logger.info(`NodeJS process exited with code ${code}`);
});
process.on("uncaughtException", (err) => {
    container.logger.error(err, "UNCAUGHT_EXCEPTION");
    container.logger.warn("Uncaught Exception detected, trying to restart...");
    process.exit(1);
});
process.on("unhandledRejection", (reason: Error) => {
    container.logger.error(reason, "UNHANDLED_REJECTION");
});
process.on("warning", (...args) => container.logger.warn({ args }, "NODE_WARNING"));

try {
    ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);
    await client.login();
} catch (error) {
    container.logger.error(error, "Failed to login client");
}
