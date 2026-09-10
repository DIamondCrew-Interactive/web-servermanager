import { networkRate, percentage, Sample } from './metrics';

const sample = (at: number, rx: number, tx: number, uptime = at): Sample => ({
    at,
    stats: {
        one: {
            status: 'running',
            isSuspended: false,
            memoryUsageInBytes: 0,
            cpuUsagePercent: 0,
            diskUsageInBytes: 0,
            networkRxInBytes: rx,
            networkTxInBytes: tx,
            uptime,
        },
    },
});
describe('dashboard transfer rates', () => {
    it('uses actual elapsed seconds instead of assuming the timer is exact', () => {
        expect(networkRate(sample(1000, 100, 200), sample(41000, 4100, 8200))).toEqual({ at: 41000, rx: 100, tx: 200 });
    });
    it('creates gaps for restarts, counter resets, missing data and changing server sets', () => {
        const before = sample(1000, 100, 200);
        expect(networkRate(before, sample(31000, 90, 500)).rx).toBeNull();
        expect(networkRate(before, sample(31000, 500, 500, 0)).rx).toBeNull();
        expect(networkRate(before, { at: 31000, stats: { one: null } }).rx).toBeNull();
        expect(networkRate(before, { at: 31000, stats: {} }).rx).toBeNull();
        expect(networkRate(before, before).rx).toBeNull();
    });
    it('sums only matching complete server samples and clamps visual meters', () => {
        const a = sample(1000, 100, 200),
            b = sample(31000, 3100, 6200);
        a.stats.two = a.stats.one;
        b.stats.two = b.stats.one;
        expect(networkRate(a, b)).toEqual({ at: 31000, rx: 200, tx: 400 });
        expect(percentage(250, 100)).toBe(100);
        expect(percentage(250, 0)).toBe(0);
    });
});
