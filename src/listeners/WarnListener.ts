import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";

@ApplyOptions<Listener.Options>({
    event: Events.Warn,
})
export class WarnListener extends Listener<typeof Events.Warn> {
    public run(message: string): void {
        this.container.logger.warn({ warning: message }, "CLIENT_WARN");
    }
}
