import { setInterval } from "node:timers";
import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { type Client, type Presence } from "discord.js";
import { presenceData } from "../config/index.js";
import { formatMS } from "../utils/functions/formatMS.js";

@ApplyOptions<Listener.Options>({
    event: Events.ClientReady,
    once: true,
})
export class ReadyListener extends Listener<typeof Events.ClientReady> {
    private readonly startTimestamp = Date.now();

    public async run(client: Client<true>): Promise<void> {
        await this.doPresence(client);
        this.container.logger.info(
            await this.formatString(
                client,
                `${client.user.tag} is ready to serve {userCount} users on {guildCount} guilds in ${formatMS(Date.now() - this.startTimestamp)}.`,
            ),
        );
    }

    private async formatString(client: Client<true>, text: string): Promise<string> {
        let newText = text;

        if (text.includes("{userCount}")) {
            const users = await this.getUserCount(client);
            newText = newText.replaceAll("{userCount}", users.toString());
        }
        if (text.includes("{textChannelCount}")) {
            const textChannels = await this.getChannelCount(client, true);
            newText = newText.replaceAll("{textChannelCount}", textChannels.toString());
        }
        if (text.includes("{voiceChannelCount}")) {
            const voiceChannels = await this.getChannelCount(client, false, true);
            newText = newText.replaceAll("{voiceChannelCount}", voiceChannels.toString());
        }
        if (text.includes("{guildCount}")) {
            const guilds = await this.getGuildCount(client);
            newText = newText.replaceAll("{guildCount}", guilds.toString());
        }

        return newText
            .replaceAll("{prefix}", this.container.config.prefix)
            .replaceAll("{tag}", client.user.tag);
    }

    private async setPresence(
        client: Client<true>,
        random: boolean,
    ): Promise<Presence | undefined> {
        const activityNumber = random
            ? Math.floor(Math.random() * presenceData.activities.length)
            : 0;
        const statusNumber = random ? Math.floor(Math.random() * presenceData.status.length) : 0;

        const activities = await Promise.all(
            presenceData.activities.map(async (a) =>
                Object.assign(a, { name: await this.formatString(client, a.name ?? "") }),
            ),
        );
        const activity = activities[activityNumber];

        return client.user.setPresence({
            activities: activity ? [activity] : [],
            status: presenceData.status[statusNumber],
        });
    }

    private async doPresence(client: Client<true>): Promise<Presence | undefined> {
        try {
            return await this.setPresence(client, false);
        } catch (error) {
            if ((error as Error).message !== "Shards are still being spawned.") {
                this.container.logger.error(error, "PRESENCE_ERROR");
            }
            return undefined;
        } finally {
            setInterval(async () => this.setPresence(client, true), presenceData.interval);
        }
    }

    private async getUserCount(client: Client<true>): Promise<number> {
        if (client.shard) {
            const shardUsers = await client.shard.broadcastEval((c) =>
                c.users.cache.map((x) => x.id),
            );
            const arr = shardUsers.flat();
            return new Set(arr).size;
        }
        return client.users.cache.size;
    }

    private async getChannelCount(
        client: Client<true>,
        textOnly: boolean = false,
        voiceOnly: boolean = false,
    ): Promise<number> {
        if (client.shard) {
            const shardChannels = await client.shard.broadcastEval(
                (c, ctx) =>
                    c.channels.cache
                        .filter((ch) => {
                            if (ctx.textOnly) {
                                return ch.type === 0 || ch.type === 11 || ch.type === 12;
                            }
                            if (ctx.voiceOnly) {
                                return ch.type === 2;
                            }
                            return true;
                        })
                        .map((ch) => ch.id),
                { context: { textOnly, voiceOnly } },
            );
            const arr = shardChannels.flat();
            return new Set(arr).size;
        }
        return client.channels.cache.size;
    }

    private async getGuildCount(client: Client<true>): Promise<number> {
        if (client.shard) {
            const guilds = await client.shard.broadcastEval((c) => c.guilds.cache.size);
            return guilds.reduce((prev, curr) => prev + curr);
        }
        return client.guilds.cache.size;
    }
}
