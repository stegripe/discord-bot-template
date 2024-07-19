import { Buffer } from "node:buffer";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ChannelType } from "discord.js";
import type { BotClient } from "../../structures/BotClient.js";

export class ClientUtils {
    public constructor(public readonly client: BotClient) {}

    public decode(string: string): string {
        return Buffer.from(string, "base64").toString("ascii");
    }

    public async getUserCount(): Promise<number> {
        let arr: string[] = [];

        if (this.client.shard) {
            const shardUsers = await this.client.shard.broadcastEval(c => c.users.cache.map(x => x.id));

            for (const users of shardUsers) {
                arr = [...arr, ...users];
            }
        } else {
            arr = this.client.users.cache.map(x => x.id);
        }

        return arr.filter((x, i) => arr.indexOf(x) === i).length;
    }

    public async getChannelCount(textOnly = false, voiceOnly = false): Promise<number> {
        let arr: string[] = [];

        if (this.client.shard) {
            const shardChannels = await this.client.shard.broadcastEval(
                (c, ctx) => c.channels.cache
                    .filter(ch => {
                        if (ctx.textOnly) {
                            return (
                                ch.type === ctx.types.GuildText ||
                                ch.type === ctx.types.PublicThread ||
                                ch.type === ctx.types.PrivateThread
                            );
                        } else if (ctx.voiceOnly) {
                            return ch.type === ctx.types.GuildVoice;
                        }

                        return true;
                    })
                    .map(ch => ch.id),
                {
                    context: { textOnly, voiceOnly, types: ChannelType }
                }
            );

            for (const channels of shardChannels) {
                arr = [...arr, ...channels];
            }
        } else {
            arr = this.client.channels.cache
                .filter(ch => {
                    if (textOnly) {
                        return (
                            ch.type === ChannelType.GuildText ||
                            ch.type === ChannelType.PublicThread ||
                            ch.type === ChannelType.PrivateThread
                        );
                    } else if (voiceOnly) {
                        return ch.type === ChannelType.GuildVoice;
                    }

                    return true;
                })
                .map(ch => ch.id);
        }

        return arr.filter((x, i) => arr.indexOf(x) === i).length;
    }

    public async getGuildCount(): Promise<number> {
        if (this.client.shard) {
            const guilds = await this.client.shard.broadcastEval(c => c.guilds.cache.size);

            return guilds.reduce((prev, curr) => prev + curr);
        }

        return this.client.guilds.cache.size;
    }

    public async importFile<T>(pth: string): Promise<T> {
        return import(pathToFileURL(pth).toString()) as Promise<T>;
    }

    public async importClass<T>(pth: string, ...args: any[]): Promise<T | undefined> {
        const file = await this.importFile<Record<string, (new (...argument: any[]) => T) | undefined>>(pth);
        const name = path.parse(pth).name;
        return file[name] ? new file[name](...args as unknown[]) : undefined;
    }
}
