import { type BaseEvent, type EventConstructor } from "../../structures/BaseEvent.js";
import { type ClassDecorator, type NonAbstractConstructor } from "../../typings/index.js";

export function Event<T extends NonAbstractConstructor<BaseEvent> = EventConstructor>(
    event: BaseEvent["name"],
): ClassDecorator<T, T> {
    return (target: T) =>
        new Proxy(target, {
            construct: (trgt: T, args: [BaseEvent["client"]]) =>
                new trgt(...args, event) as unknown as T,
        });
}
