import { type ChildProcess, spawn } from "node:child_process";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { Collection, PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import kill from "tree-kill";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@ApplyOptions<Command.Options>({
    name: "spawn",
    description: "Spawn a process for executing bash commands.",
    preconditions: ["DevOnly"],
    requiredClientPermissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
    ],
    chatInputCommand(
        builder: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[0],
        opts: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[1],
    ): SlashCommandBuilder {
        return builder
            .setName(opts.name ?? "spawn")
            .setDescription(opts.description ?? "Spawn a process for executing bash commands.")
            .addStringOption((option) =>
                option
                    .setName("option")
                    .setDescription("create or terminate")
                    .setRequired(true)
                    .addChoices(
                        { name: "create", value: "create" },
                        { name: "terminate", value: "terminate" },
                    ),
            )
            .addStringOption((option) =>
                option.setName("name").setDescription("The process name").setRequired(true),
            )
            .addStringOption((option) =>
                option
                    .setName("command")
                    .setDescription("The command to execute (for create)")
                    .setRequired(false),
            ) as SlashCommandBuilder;
    },
})
export class SpawnCommand extends ContextCommand {
    private readonly processes = new Collection<string, ChildProcess>();

    public async contextRun(ctx: CommandContext): Promise<void> {
        if (ctx.isCommandInteraction() && !ctx.deferred) {
            await ctx.deferReply();
        }

        let option: string | undefined;
        let name: string | undefined;
        let command: string | undefined;

        if (ctx.isChatInputInteractionContext()) {
            option = ctx.options.getString("option") ?? undefined;
            name = ctx.options.getString("name") ?? undefined;
            command = ctx.options.getString("command") ?? undefined;
        } else if (ctx.isMessageContext()) {
            option = (await ctx.args?.pickResult("string"))?.unwrapOr(undefined);
            name = (await ctx.args?.pickResult("string"))?.unwrapOr(undefined);
            command = (await ctx.args?.restResult("string"))?.unwrapOr(undefined);
        }

        if (option === "create") {
            await this.handleCreate(ctx, name, command);
        } else if (option === "terminate") {
            await this.handleTerminate(ctx, name);
        } else {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        "Invalid usage, valid options are **`create`** and **`terminate`**",
                        true,
                    ),
                ],
            });
        }
    }

    private async handleCreate(
        ctx: CommandContext,
        name: string | undefined,
        command: string | undefined,
    ): Promise<void> {
        if (!name) {
            await ctx.reply({
                embeds: [createEmbed("error", "Please provide the process name.", true)],
            });
            return;
        }
        if (!command) {
            await ctx.reply({
                embeds: [createEmbed("error", "Please provide a command to execute.", true)],
            });
            return;
        }
        if (this.processes.has(name)) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        "There's a running process with that name. Terminate it first, and then try again.",
                    ),
                ],
            });
            return;
        }

        await ctx.reply({ embeds: [createEmbed("info", `❯_ ${command}`)] });

        const [cmd, ...args] = command.split(" ");
        const childProcess = spawn(cmd, args, {
            shell: true,
            windowsHide: true,
        })
            .on("spawn", () => {
                void ctx.reply({
                    embeds: [createEmbed("success", `Process **\`${name}\`** has spawned.`, true)],
                });
            })
            .on("close", (code: number | null, signal: string | null) => {
                this.processes.delete(name);
                void ctx.reply({
                    embeds: [
                        createEmbed(
                            "warn",
                            `Process **\`${name}\`** closed with code **\`${code}\`**, signal **\`${signal}\`**`,
                        ),
                    ],
                });
            })
            .on("error", (err) => {
                void ctx.reply({
                    embeds: [
                        createEmbed(
                            "error",
                            `An error occurred on the process **\`${name}\`**: \n\`\`\`${err.message}\`\`\``,
                            true,
                        ),
                    ],
                });
            });

        childProcess.stdout.on("data", async (data) => {
            const pages = SpawnCommand.paginate(String(data), 1_950);
            for (const page of pages) {
                await ctx.reply(`\`\`\`\n${page}\`\`\``);
            }
        });
        childProcess.stderr.on("data", async (data) => {
            const pages = SpawnCommand.paginate(String(data), 1_950);
            for (const page of pages) {
                await ctx.reply(`\`\`\`\n${page}\`\`\``);
            }
        });

        this.processes.set(name, childProcess);
    }

    private async handleTerminate(ctx: CommandContext, name: string | undefined): Promise<void> {
        if (!name) {
            await ctx.reply({
                embeds: [createEmbed("error", "Please provide the process name.", true)],
            });
            return;
        }
        const childProcess = this.processes.get(name);
        if (!childProcess) {
            await ctx.reply({
                embeds: [createEmbed("error", "There's no process with that name.", true)],
            });
            return;
        }

        try {
            if (childProcess.pid !== undefined) {
                await new Promise<void>((resolve, reject) => {
                    kill(childProcess.pid as number, "SIGTERM", (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
            this.processes.delete(name);
            await ctx.reply({
                embeds: [createEmbed("success", "Process has terminated.", true)],
            });
        } catch (error) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        `An error occurred while trying to terminate process: ${(error as Error).message}`,
                    ),
                ],
            });
        }
    }

    private static paginate(text: string, limit: number = 2_000): string[] {
        const lines = text.trim().split("\n");
        const pages = [];
        let chunk = "";

        for (const line of lines) {
            if (chunk.length + line.length > limit && chunk.length > 0) {
                pages.push(chunk);
                chunk = "";
            }

            if (line.length > limit) {
                const lineChunks = line.length / limit;
                for (let i = 0; i < lineChunks; i++) {
                    const start = i * limit;
                    const end = start + limit;
                    pages.push(line.slice(start, end));
                }
            } else {
                chunk += `${line}\n`;
            }
        }

        if (chunk.length > 0) {
            pages.push(chunk);
        }

        return pages;
    }
}
