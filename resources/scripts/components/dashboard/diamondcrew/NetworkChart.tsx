import React from 'react';
import { NetworkPoint } from './metrics';

export default ({ points }: { points: NetworkPoint[] }) => {
    const valid = points.filter((p) => p.rx !== null && p.tx !== null);
    const max = Math.max(1024, ...valid.flatMap((p) => [p.rx!, p.tx!]));
    const unit = max >= 1048576 ? 1048576 : 1024;
    const unitLabel = unit === 1048576 ? 'MiB/s' : 'KiB/s';
    const start = points[0]?.at || 0,
        end = points[points.length - 1]?.at || 1;
    const line = (key: 'rx' | 'tx') => {
        let drawing = false;
        return points
            .map((p) => {
                if (p[key] === null) {
                    drawing = false;
                    return '';
                }
                const x = 60 + ((p.at - start) / Math.max(1, end - start)) * 480;
                const y = 190 - (p[key]! / max) * 160;
                const segment = `${drawing ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
                drawing = true;
                return segment;
            })
            .join(' ');
    };
    return (
        <div className={'dc-network-chart'}>
            <div className={'dc-chart-legend'}>
                <span>
                    <i />
                    Inbound
                </span>
                <span>
                    <i />
                    Outbound
                </span>
            </div>
            <svg
                viewBox={'0 0 560 225'}
                role={'img'}
                aria-label={'Network transfer rate for servers on this page, sampled every 30 seconds'}
            >
                {[0, 1, 2, 3, 4].map((i) => (
                    <g key={i}>
                        <line x1={60} x2={540} y1={30 + i * 40} y2={30 + i * 40} className={'dc-grid-line'} />
                        <text x={50} y={34 + i * 40} textAnchor={'end'}>
                            {((max * (1 - i / 4)) / unit).toFixed(1)} {unitLabel}
                        </text>
                    </g>
                ))}
                {[0, 1, 2, 3, 4].map((i) => (
                    <g key={i}>
                        <line x1={60 + i * 120} x2={60 + i * 120} y1={30} y2={190} className={'dc-grid-line'} />
                        <text x={60 + i * 120} y={215} textAnchor={'middle'}>
                            {points.length > 1
                                ? new Date(start + ((end - start) * i) / 4).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                  })
                                : ''}
                        </text>
                    </g>
                ))}
                <path d={line('rx')} className={'dc-chart-rx'} />
                <path d={line('tx')} className={'dc-chart-tx'} />
            </svg>
            {valid.length < 2 && <p className={'dc-chart-waiting'}>Collecting live samples…</p>}
        </div>
    );
};
