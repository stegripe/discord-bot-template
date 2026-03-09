import { exec } from "node:child_process";
import { promisify } from "node:util";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

const execPromise: (
    command: string,
    options: { encoding: BufferEncoding },
) => Promise<{ stdout: string; stderr: string }> = promisify(exec);

@ApplyOptions<Command.Options>({
    name: "exec",
    aliases: ["$", "bash", "execute"],
    description: "Executes a bash command.",
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
            .setName(opts.name ?? "exec")
            .setDescription(opts.description ?? "Executes a bash command.")
            .addStringOption((option) =>
                option
                    .setName("command")
                    .setDescription("The bash command to execute")
                    .setRequired(true),
            ) as SlashCommandBuilder;
    },
})
export class ExecCommand extends ContextCommand {
    public async contextRun(ctx: CommandContext): Promise<void> {
        if (ctx.isCommandInteraction() && !ctx.deferred) {
            await ctx.deferReply();
        }

        let command = "";
        if (ctx.isChatInputInteractionContext()) {
            command = ctx.options.getString("command") ?? "";
        } else if (ctx.isMessageContext()) {
            command = (await ctx.args?.restResult("string"))?.unwrapOr("") ?? "";
        }

        if (!command) {
            await ctx.reply({
                embeds: [createEmbed("error", "Please provide a bash command to execute.", true)],
            });
            return;
        }

        const msg = await ctx.reply({ content: `❯_ ${command}` });
        try {
            const execRes = await execPromise(command, { encoding: "utf8" });
            const pages = ExecCommand.paginate(execRes.stdout);
            for (const page of pages) {
                if (ctx.channel?.isSendable()) {
                    await ctx.channel.send(`\`\`\`\n${page}\`\`\``);
                }
            }
        } catch (error) {
            await msg.edit(`\`\`\`js\n${(error as Error).message}\`\`\``);
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
