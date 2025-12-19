import { type ColorResolvable, EmbedBuilder } from "discord.js";
import { embedColor } from "../../config/index.js";

type HexColorsType = "error" | "info" | "success" | "warn";
const hexColors: Record<HexColorsType, string> = {
    error: "Red",
    info: embedColor as string,
    success: "Green",
    warn: "Yellow",
};

export function createEmbed(
    type: HexColorsType,
    message?: string,
    emoji: boolean = false,
): EmbedBuilder {
    const embed = new EmbedBuilder().setColor(hexColors[type] as ColorResolvable);

    if (message !== undefined && message !== "") {
        embed.setDescription(message);
    }
    if (type === "error" && emoji) {
        embed.setDescription(`❌ **|** ${message}`);
    }
    if (type === "success" && emoji) {
        embed.setDescription(`✅ **|** ${message}`);
    }
    return embed;
}
