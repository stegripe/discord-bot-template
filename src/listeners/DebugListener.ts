import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";

@ApplyOptions<Listener.Options>({
    event: Events.Debug,
})
export class DebugListener extends Listener<typeof Events.Debug> {
    public run(message: string): void {
        this.container.logger.debug(message);
    }
}
