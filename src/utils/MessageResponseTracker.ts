import { container } from "@sapphire/framework";

const RESPONSE_TTL_SECONDS = 86_400;
const store = new Map<string, { value: string; expires?: number }>();

function getFromStore<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) {
        return null;
    }

    if (entry.expires && Date.now() > entry.expires) {
        store.delete(key);
        return null;
    }

    return JSON.parse(entry.value) as T;
}

export class MessageResponseTracker {
    public async track(
        commandMessageId: string,
        responseMessageId: string,
        channelId: string,
    ): Promise<void> {
        store.set(commandMessageId, {
            value: JSON.stringify({ responseMessageId, channelId }),
            expires: Date.now() + RESPONSE_TTL_SECONDS * 1_000,
        });
    }

    public async get(
        commandMessageId: string,
    ): Promise<{ responseMessageId: string; channelId: string } | null> {
        return getFromStore<{ responseMessageId: string; channelId: string }>(commandMessageId);
    }

    public async untrack(commandMessageId: string): Promise<void> {
        store.delete(commandMessageId);
    }

    public async handleDelete(commandMessageId: string): Promise<void> {
        const data = await this.get(commandMessageId);
        if (!data) {
            return;
        }

        try {
            const channel = container.client.channels.cache.get(data.channelId);
            if (channel && "messages" in channel) {
                const message = await channel.messages
                    .fetch(data.responseMessageId)
                    .catch(() => null);
                if (message && message.author.id === container.client.user?.id) {
                    await message.delete().catch(() => null);
                    container.logger.debug(
                        `Deleted response message ${data.responseMessageId} for deleted command ${commandMessageId}`,
                    );
                }
            }
        } catch {
            // Silently ignore fetch/delete failures
        }

        await this.untrack(commandMessageId);
    }
}

export const messageResponseTracker = new MessageResponseTracker();
