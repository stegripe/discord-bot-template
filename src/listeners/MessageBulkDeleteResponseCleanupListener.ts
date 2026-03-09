import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { Collection, type Message, type PartialMessage, type Snowflake } from "discord.js";
import { messageResponseTracker } from "../utils/index.js";

@ApplyOptions<Listener.Options>({
    name: "MessageBulkDeleteResponseCleanup",
    event: Events.MessageBulkDelete,
})
export class MessageBulkDeleteResponseCleanupListener extends Listener {
    public async run(messages: Collection<Snowflake, Message | PartialMessage>): Promise<void> {
        const nonBotMessages = messages.filter((msg) => !msg.author?.bot);

        await Promise.allSettled(
            nonBotMessages.map((msg) => messageResponseTracker.handleDelete(msg.id)),
        );
    }
}
