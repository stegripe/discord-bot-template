import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { type ColorResolvable, PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@ApplyOptions<Command.Options>({
    name: "ping",
    aliases: ["pong", "pang", "pung", "peng", "pingpong"],
    description: "Shows current ping of the bot.",
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
            .setName(opts.name ?? "ping")
            .setDescription(
                opts.description ?? "Shows current ping of the bot.",
            ) as SlashCommandBuilder;
    },
})
export class PingCommand extends ContextCommand {
    public async contextRun(ctx: CommandContext): Promise<void> {
        if (ctx.isCommandInteraction() && !ctx.deferred) {
            await ctx.deferReply();
        }

        const msg = await ctx.reply({ content: "🏓" });
        const latency = msg.createdTimestamp - ctx.context.createdTimestamp;
        const wsLatency = this.container.client.ws.ping.toFixed(0);
        const embed = createEmbed("info")
            .setColor(PingCommand.searchHex(Number(wsLatency)))
            .setAuthor({ name: "🏓 PONG" })
            .addFields(
                {
                    name: "📶 **|** API",
                    value: `\`${latency}\` ms`,
                    inline: true,
                },
                {
                    name: "🌐 **|** WebSocket",
                    value: `\`${wsLatency}\` ms`,
                    inline: true,
                },
            )
            .setFooter({
                text: `Latency of: ${this.container.client.user?.tag}`,
                iconURL: this.container.client.user?.displayAvatarURL(),
            })
            .setTimestamp();

        await msg.edit({ content: "", embeds: [embed] });
    }

    private static searchHex(ms: number): ColorResolvable {
        const listColorHex: [number, number, string][] = [
            [0, 20, "Green"],
            [21, 50, "Green"],
            [51, 100, "Yellow"],
            [101, 150, "Yellow"],
            [150, 200, "Red"],
        ];

        const defaultColor = "Red";

        const min = listColorHex.map((el) => el[0]);
        const max = listColorHex.map((el) => el[1]);
        const hex = listColorHex.map((el) => el[2]);
        let ret: number | string = "#000000";

        for (let i = 0; i < listColorHex.length; i++) {
            if (min[i] <= ms && ms <= max[i]) {
                ret = hex[i];
                break;
            }
            ret = defaultColor;
        }
        return ret as ColorResolvable;
    }
}
