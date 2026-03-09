import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@ApplyOptions<Command.Options>({
    name: "help",
    aliases: ["h", "command", "commands", "cmd", "cmds"],
    description: "Shows the command list or information for a specific command.",
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
            .setName(opts.name ?? "help")
            .setDescription(
                opts.description ?? "Shows the command list or information for a specific command.",
            )
            .addStringOption((option) =>
                option
                    .setName("command")
                    .setDescription("Command name to view specific information")
                    .setRequired(false),
            ) as SlashCommandBuilder;
    },
})
export class HelpCommand extends ContextCommand {
    public async contextRun(ctx: CommandContext): Promise<void> {
        if (ctx.isCommandInteraction() && !ctx.deferred) {
            await ctx.deferReply();
        }

        let commandName: string | undefined;
        if (ctx.isChatInputInteractionContext()) {
            commandName = ctx.options.getString("command") ?? undefined;
        } else if (ctx.isMessageContext()) {
            commandName = (await ctx.args?.pickResult("string"))?.unwrapOr(undefined);
        }

        const commands = this.store;

        if (commandName) {
            const command =
                commands.get(commandName) ??
                commands.find((cmd) => cmd.aliases.includes(commandName));

            if (!command) {
                await ctx.reply({
                    embeds: [createEmbed("error", "Command not found.", true)],
                });
                return;
            }

            const embed = createEmbed("info")
                .setAuthor({
                    name: `${this.container.client.user?.username} - Information: ${command.name}`,
                    iconURL: this.container.client.user?.displayAvatarURL(),
                })
                .addFields(
                    { name: "Name", value: `\`${command.name}\``, inline: true },
                    {
                        name: "Description",
                        value: command.description || "No description.",
                        inline: true,
                    },
                    {
                        name: "Aliases",
                        value:
                            command.aliases.length > 0
                                ? command.aliases.map((a) => `\`${a}\``).join(", ")
                                : "None",
                        inline: false,
                    },
                    {
                        name: "Category",
                        value: command.fullCategory.join(" > ") || "Uncategorized",
                        inline: true,
                    },
                )
                .setFooter({
                    text: `${this.container.config.prefix}help [command]`,
                    iconURL: "https://cdn.stegripe.org/images/information.png",
                });

            await ctx.reply({ embeds: [embed] });
            return;
        }

        const isDev = this.container.config.devs.includes(ctx.author.id);
        const categories = new Map<string, Command[]>();

        for (const command of commands.values()) {
            const category = command.fullCategory[0] || "uncategorized";
            if (!isDev && category.toLowerCase() === "developer") {
                continue;
            }
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category)?.push(command);
        }

        const embed = createEmbed("info").setAuthor({
            name: `${this.container.client.user?.username} - Command List`,
            iconURL: this.container.client.user?.displayAvatarURL(),
        });

        for (const [category, cmds] of categories) {
            embed.addFields({
                name: `**${category.toUpperCase()}**`,
                value: cmds.map((c) => `\`${c.name}\``).join(", "),
            });
        }

        embed.setFooter({
            text: `${this.container.config.prefix}help <command> for more information.`,
            iconURL: "https://cdn.stegripe.org/images/information.png",
        });

        await ctx.reply({ embeds: [embed] });
    }
}
