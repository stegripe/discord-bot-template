import { setInterval } from "node:timers";
import { Presence } from "discord.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { Event } from "../utils/decorators/Event.js";

@Event("ready")
export class ReadyEvent extends BaseEvent {
    public async execute(): Promise<void> {
        await this.doPresence();
        this.client.logger.info(await this.formatString("{tag} is ready to serve {userCount} users on {guildCount} guilds with " +
            "{textChannelCount} text channels and {voiceChannelCount} voice channels."));
    }

    private async formatString(text: string): Promise<string> {
        let newText = text;

        if (text.includes("{userCount}")) {
            const users = await this.client.utils.getUserCount();

            newText = newText.replaceAll("{userCount}", users.toString());
        }
        if (text.includes("{textChannelCount}")) {
            const textChannels = await this.client.utils.getChannelCount(true);

            newText = newText.replaceAll("{textChannelCount}", textChannels.toString());
        }
        if (text.includes("{voiceChannelCount}")) {
            const voiceChannels = await this.client.utils.getChannelCount(false, true);

            newText = newText.replaceAll("{voiceChannelCount}", voiceChannels.toString());
        }
        if (text.includes("{guildCount}")) {
            const guilds = await this.client.utils.getGuildCount();

            newText = newText.replaceAll("{guildCount}", guilds.toString());
        }

        return newText
            .replaceAll("{prefix}", this.client.config.prefix)
            .replaceAll("{tag}", this.client.user?.tag ?? "");
    }

    private async setPresence(random: boolean): Promise<Presence | undefined> {
        const activityNumber = random
            ? Math.floor(Math.random() * this.client.config.presenceData.activities.length)
            : 0;
        const statusNumber = random
            ? Math.floor(Math.random() * this.client.config.presenceData.status.length)
            : 0;
        const activities = await Promise.all(
            this.client.config.presenceData.activities.map(
                async a => Object.assign(a, { name: await this.formatString(a.name) })
            )
        );
        const activity = activities[activityNumber];

        return this.client.user?.setPresence({
            activities: (activity as { name: string; } | undefined) ? [activity] : [],
            status: this.client.config.presenceData.status[statusNumber]
        });
    }

    private async doPresence(): Promise<Presence | undefined> {
        try {
            return await this.setPresence(false);
        } catch (error) {
            if ((error as Error).message !== "Shards are still being spawned.") {
                this.client.logger.error({ err: error }, "PRESENCE_ERROR");
            }
            return undefined;
        } finally {
            setInterval(async () => this.setPresence(true), this.client.config.presenceData.interval);
        }
    }
}
