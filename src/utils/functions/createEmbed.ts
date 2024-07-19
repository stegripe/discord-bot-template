import type { ColorResolvable } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { embedColor } from "../../config/index.js";

type hexColorsType = "error" | "info" | "success" | "warn";
const hexColors: Record<hexColorsType, string> = {
    error: "Red",
    info: embedColor as string,
    success: "Green",
    warn: "Yellow"
};

export function createEmbed(type: hexColorsType, message?: string, emoji = false): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(hexColors[type] as ColorResolvable);

    if (message !== undefined && message !== "") embed.setDescription(message);
    if (type === "error" && emoji) embed.setDescription(`❌ **|** ${message}`);
    if (type === "success" && emoji) embed.setDescription(`✅ **|** ${message}`);
    return embed;
}
