import type { CommandComponent } from "../typings/index.js";
import type { BotClient } from "./BotClient.js";
import type { CommandContext } from "./CommandContext.js";

export abstract class BaseCommand implements CommandComponent {
    public constructor(public readonly client: BotClient, public meta: CommandComponent["meta"]) {}

    public abstract execute(ctx: CommandContext): any;
}

export type CommandConstructor = new (
    ...args: ConstructorParameters<typeof BaseCommand>
) => BaseCommand;
