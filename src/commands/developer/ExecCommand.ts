import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { TextChannel, DMChannel, NewsChannel, ThreadChannel } from "discord.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

const execPromise = promisify(exec);

@Command<typeof ExecCommand>({
    aliases: ["$", "bash", "execute"],
    description: "Executes bash command.",
    devOnly: true,
    name: "exec",
    usage: "{prefix}exec <bash>"
})
export class ExecCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.args.length === 0) {
            await ctx.reply({
                embeds: [createEmbed("error", "Please provide a bash command to execute.", true)]
            });
            return;
        }

        const msg = await ctx.reply({ content: `❯_ ${ctx.args.join(" ")}` });
        try {
            const execRes = await execPromise(ctx.args.join(" "), { encoding: "utf8" });
            const pages = ExecCommand.paginate(execRes.stdout);
            const channel = ctx.channel as DMChannel | NewsChannel | TextChannel | ThreadChannel | null;
            for (const page of pages) {
                await channel?.send(`\`\`\`\n${page}\`\`\``);
            }
        } catch (error) {
            await msg.edit(`\`\`\`js\n${(error as Error).message}\`\`\``);
        }
    }

    private static paginate(text: string, limit = 2_000): string[] {
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
