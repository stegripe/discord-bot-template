import { PermissionFlagsBits, type PermissionResolvable } from "discord.js";
import { createEmbed } from "../functions/createEmbed.js";
import { createCmdDecorator } from "./createCmdDecorator.js";

export function memberReqPerms(
    perms: PermissionResolvable,
    fallbackMsg: string,
): ReturnType<typeof createCmdDecorator> {
    return createCmdDecorator((ctx) => {
        if (ctx.member?.permissions.has(perms) !== true) {
            void ctx.reply({
                embeds: [createEmbed("error", fallbackMsg, true)],
            });
            return false;
        }
        return true;
    });
}

export function botReqPerms(
    perms: PermissionResolvable,
    fallbackMsg: string,
): ReturnType<typeof createCmdDecorator> {
    return createCmdDecorator((ctx) => {
        if (ctx.guild?.members.me?.permissions.has(perms) !== true) {
            void ctx.reply({
                embeds: [createEmbed("error", fallbackMsg, true)],
            });
            return false;
        }
        return true;
    });
}

export function isModerator(): ReturnType<typeof createCmdDecorator> {
    return memberReqPerms(
        [PermissionFlagsBits.ManageRoles],
        "Sorry, but you're not the server staff.",
    );
}
