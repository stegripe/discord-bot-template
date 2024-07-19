import type { BaseEvent, EventConstructor } from "../../structures/BaseEvent.js";
import type { ClassDecorator, NonAbstractConstructor } from "../../typings/index.js";

export function Event<T extends NonAbstractConstructor<any> = EventConstructor>(
    event: BaseEvent["name"]
): ClassDecorator<T, T> {
    return target => new Proxy(target, {
        construct: (trgt, args: [BaseEvent["client"]]) => new trgt(...args, event) as T
    });
}
