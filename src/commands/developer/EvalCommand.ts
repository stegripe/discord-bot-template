import process from "node:process";
import { inspect } from "node:util";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command<typeof EvalCommand>({
    aliases: ["evaluate", "ev", "js-exec"],
    description: "Evaluate to the bot.",
    devOnly: true,
    name: "eval",
    usage: "{prefix}eval <some code>"
})
export class EvalCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const embed = createEmbed("info")
            .addFields({ name: "Input", value: `\`\`\`js\n${ctx.args.join(" ")}\`\`\`` });

        try {
            const code = ctx.args
                .join(" ")
                // eslint-disable-next-line prefer-named-capture-group
                .replace(/^\s*\n?(```(?:\S+\n)?(.*?)```|.*)$/su, (_, a: string, b: string) => a.startsWith("```") ? b : a);
            if (!code) {
                await ctx.reply({
                    embeds: [createEmbed("error", "No code was provided.", true)]
                });

                return;
            }

            const isAsync = (/.*\s--async\s*(?:--silent)?$/u).test(code);
            const isSilent = (/.*\s--silent\s*(?:--async)?$/u).test(code);
            const toExecute = isAsync || isSilent
                ? code.replace(/--(?:async|silent)\s*(?:--(?:silent|async))?$/u, "")
                : code;
            const evaled = inspect(
                // eslint-disable-next-line no-eval
                await eval(
                    isAsync
                        ? `(async () => {\n${toExecute}\n})()`
                        : toExecute
                ), { depth: 0 }
            );

            if (isSilent) return;

            const cleaned = this.clean(evaled);
            const output = cleaned.length > 1_024
                ? `${await this.hastebin(cleaned)}.js`
                : `\`\`\`js\n${cleaned}\`\`\``;

            embed.addFields({ name: "Output", value: output });

            try {
                await ctx.reply({
                    embeds: [embed]
                });
            } catch (error) {
                this.client.logger.error("PROMISE_ERR:", error);
            }
        } catch (error_) {
            const cleaned = this.clean(String(error_));
            const isTooLong = cleaned.length > 1_024;
            const error = isTooLong
                ? `${await this.hastebin(cleaned)}.js`
                : `\`\`\`js\n${cleaned}\`\`\``;

            embed.setColor("Red").addFields({ name: "Error", value: error });
            try {
                await ctx.reply({
                    embeds: [embed]
                });
            } catch (error__) {
                this.client.logger.error("PROMISE_ERR:", error__);
            }
        }
    }

    private clean(text: string): string {
        return text
            .replaceAll(new RegExp(process.env.DISCORD_TOKEN as unknown as string, "gu"), "[REDACTED]")
            .replaceAll("`", `\`${String.fromCodePoint(8_203)}`)
            .replaceAll("@", `@${String.fromCodePoint(8_203)}`);
    }

    private async hastebin(text: string): Promise<string> {
        const result = await this.client.request.post("https://bin.stegripe.org/documents", {
            body: text
        }).json<{ key: string; }>();

        return `https://bin.stegripe.org/${result.key}`;
    }
}
