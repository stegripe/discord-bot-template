/* eslint-disable unicorn/filename-case */
import { formatDuration, intervalToDuration } from "date-fns";

export function formatMS(ms: number): string {
    if (Number.isNaN(ms)) throw new Error("Value is not a number.");
    return formatDuration(intervalToDuration({ start: 0, end: ms }));
}
