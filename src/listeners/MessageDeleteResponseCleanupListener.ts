import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { type Message, type PartialMessage } from "discord.js";
import { messageResponseTracker } from "../utils/index.js";

@ApplyOptions<Listener.Options>({
    name: "MessageDeleteResponseCleanup",
    event: Events.MessageDelete,
})
export class MessageDeleteResponseCleanupListener extends Listener {
    public async run(message: Message | PartialMessage): Promise<void> {
        if (message.author?.bot) {
            return;
        }

        await messageResponseTracker.handleDelete(message.id);
    }
}
