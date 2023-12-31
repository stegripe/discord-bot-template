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

            newText = newText.replace(/{userCount}/g, users.toString());
        }
        if (text.includes("{textChannelCount}")) {
            const textChannels = await this.client.utils.getChannelCount(true);

            newText = newText.replace(/{textChannelCount}/g, textChannels.toString());
        }
        if (text.includes("{voiceChannelCount}")) {
            const voiceChannels = await this.client.utils.getChannelCount(false, true);

            newText = newText.replace(/{voiceChannelCount}/g, voiceChannels.toString());
        }
        if (text.includes("{guildCount}")) {
            const guilds = await this.client.utils.getGuildCount();

            newText = newText.replace(/{guildCount}/g, guilds.toString());
        }

        return newText
            .replace(/{prefix}/g, this.client.config.prefix)
            .replace(/{tag}/g, this.client.user!.tag);
    }

    private async setPresence(random: boolean): Promise<Presence> {
        const activityNumber = random
            ? Math.floor(Math.random() * this.client.config.presenceData.activities.length)
            : 0;
        const statusNumber = random
            ? Math.floor(Math.random() * this.client.config.presenceData.status.length)
            : 0;
        const activity = (
            await Promise.all(
                this.client.config.presenceData.activities.map(
                    async a => Object.assign(a, { name: await this.formatString(a.name) })
                )
            )
        )[activityNumber];

        return this.client.user!.setPresence({
            activities: (activity as { name: string } | undefined) ? [activity] : [],
            status: this.client.config.presenceData.status[statusNumber]
        });
    }

    private async doPresence(): Promise<Presence | undefined> {
        try {
            return await this.setPresence(false);
        } catch (e) {
            if ((e as Error).message !== "Shards are still being spawned.") {
                this.client.logger.error(String(e));
            }
            return undefined;
        } finally {
            setInterval(() => this.setPresence(true), this.client.config.presenceData.interval);
        }
    }
}
