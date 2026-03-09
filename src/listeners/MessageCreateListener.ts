import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { type Message } from "discord.js";
import { createEmbed } from "../utils/functions/createEmbed.js";

@ApplyOptions<Listener.Options>({
    event: Events.MessageCreate,
})
export class MessageCreateListener extends Listener<typeof Events.MessageCreate> {
    public async run(message: Message): Promise<void> {
        if (message.author.bot || message.channel.isDMBased()) {
            return;
        }

        if (
            message.content === `<@${this.container.client.user?.id}>` ||
            message.content === `<@!${this.container.client.user?.id}>`
        ) {
            try {
                await message.reply({
                    embeds: [
                        createEmbed(
                            "info",
                            `👋 **|** Hi ${message.author.toString()}, my prefix is **\`${this.container.config.prefix}\`**`,
                        ),
                    ],
                });
            } catch (error) {
                this.container.logger.error(error, "PROMISE_ERR");
            }
        }
    }
}
