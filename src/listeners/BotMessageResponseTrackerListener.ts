import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { type Message } from "discord.js";
import { messageResponseTracker } from "../utils/index.js";

@ApplyOptions<Listener.Options>({
    name: "BotMessageResponseTracker",
    event: Events.MessageCreate,
})
export class BotMessageResponseTrackerListener extends Listener {
    public async run(message: Message): Promise<void> {
        if (message.author.id !== this.container.client.user?.id) {
            return;
        }

        if (!message.reference?.messageId) {
            return;
        }

        await messageResponseTracker.track(
            message.reference.messageId,
            message.id,
            message.channel.id,
        );
    }
}
