import { type BaseCommand, type CommandConstructor } from "../../structures/BaseCommand.js";
import { type ClassDecorator, type NonAbstractConstructor } from "../../typings/index.js";

export function Command<T extends NonAbstractConstructor<BaseCommand> = CommandConstructor>(
    meta: BaseCommand["meta"],
): ClassDecorator<T, T> {
    return (target: T) =>
        new Proxy(target, {
            construct: (trgt: T, args: [BaseCommand["client"]]) => new trgt(...args, meta),
        });
}
