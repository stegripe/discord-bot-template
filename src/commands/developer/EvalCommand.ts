import process from "node:process";
import { inspect } from "node:util";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@ApplyOptions<Command.Options>({
    name: "eval",
    aliases: ["evaluate", "ev", "js-exec"],
    description: "Evaluate JavaScript code.",
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
            .setName(opts.name ?? "eval")
            .setDescription(opts.description ?? "Evaluate JavaScript code.")
            .addStringOption((option) =>
                option.setName("code").setDescription("The code to evaluate").setRequired(true),
            ) as SlashCommandBuilder;
    },
})
export class EvalCommand extends ContextCommand {
    public async contextRun(ctx: CommandContext): Promise<void> {
        if (ctx.isCommandInteraction() && !ctx.deferred) {
            await ctx.deferReply();
        }

        let code = "";
        if (ctx.isChatInputInteractionContext()) {
            code = ctx.options.getString("code") ?? "";
        } else if (ctx.isMessageContext()) {
            code = (await ctx.args?.restResult("string"))?.unwrapOr("") ?? "";
        }

        if (!code) {
            await ctx.reply({
                embeds: [createEmbed("error", "No code was provided.", true)],
            });
            return;
        }

        const embed = createEmbed("info").addFields({
            name: "Input",
            value: `\`\`\`js\n${code}\`\`\``,
        });

        try {
            const isAsync = /.*\s--async\s*(?:--silent)?$/u.test(code);
            const isSilent = /.*\s--silent\s*(?:--async)?$/u.test(code);
            const toExecute =
                isAsync || isSilent
                    ? code.replace(/--(?:async|silent)\s*(?:--(?:silent|async))?$/u, "")
                    : code;
            const evaled = inspect(
                // biome-ignore lint/security/noGlobalEval: This is a developer eval command
                await eval(isAsync ? `(async () => {\n${toExecute}\n})()` : toExecute),
                { depth: 0 },
            );

            if (isSilent) {
                return;
            }

            const cleaned = this.clean(evaled);
            const output =
                cleaned.length > 1_024
                    ? `${await this.hastebin(cleaned)}.js`
                    : `\`\`\`js\n${cleaned}\`\`\``;

            embed.addFields({ name: "Output", value: output });
            await ctx.reply({ embeds: [embed] });
        } catch (error) {
            const cleaned = this.clean(String(error));
            const isTooLong = cleaned.length > 1_024;
            const errorOutput = isTooLong
                ? `${await this.hastebin(cleaned)}.js`
                : `\`\`\`js\n${cleaned}\`\`\``;

            embed.setColor("Red").addFields({ name: "Error", value: errorOutput });
            await ctx.reply({ embeds: [embed] });
        }
    }

    private clean(text: string): string {
        return text
            .replaceAll(
                new RegExp(process.env.DISCORD_TOKEN as unknown as string, "gu"),
                "[REDACTED]",
            )
            .replaceAll("`", `\`${String.fromCodePoint(8_203)}`)
            .replaceAll("@", `@${String.fromCodePoint(8_203)}`);
    }

    private async hastebin(text: string): Promise<string> {
        const response = await fetch("https://bin.stegripe.org/documents", {
            method: "POST",
            body: text,
        });
        const result = (await response.json()) as { key: string };
        return `https://bin.stegripe.org/${result.key}`;
    }
}
