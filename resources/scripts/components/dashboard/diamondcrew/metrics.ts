import { ServerStats } from '@/api/server/getServerResourceUsage';

export interface Sample {
    at: number;
    stats: Record<string, ServerStats | null>;
}
export interface NetworkPoint {
    at: number;
    rx: number | null;
    tx: number | null;
}
// A restart, missing sample or counter reset creates a gap instead of an invented spike.
export function networkRate(previous: Sample, next: Sample): NetworkPoint {
    const seconds = (next.at - previous.at) / 1000;
    const empty = { at: next.at, rx: null, tx: null };
    const ids = Object.keys(next.stats);
    if (seconds <= 0 || !ids.length || ids.length !== Object.keys(previous.stats).length) return empty;
    let rx = 0,
        tx = 0;
    for (const id of ids) {
        const a = previous.stats[id],
            b = next.stats[id];
        if (
            !a ||
            !b ||
            b.uptime < a.uptime ||
            b.networkRxInBytes < a.networkRxInBytes ||
            b.networkTxInBytes < a.networkTxInBytes
        )
            return empty;
        rx += (b.networkRxInBytes - a.networkRxInBytes) / seconds;
        tx += (b.networkTxInBytes - a.networkTxInBytes) / seconds;
    }
    return { at: next.at, rx, tx };
}

export function percentage(value: number, limit: number) {
    return limit > 0 ? Math.min(100, Math.max(0, (value / limit) * 100)) : 0;
}
