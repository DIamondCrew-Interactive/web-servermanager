import React from 'react';
import { percentage } from './metrics';

export default ({ label, value, limit, text }: { label: string; value: number; limit: number; text: string }) => (
    <div className={`dc-meter${limit > 0 && value >= limit * 0.9 ? ' dc-meter--warning' : ''}`}>
        <div>
            <span>{label}</span>
            <span>{text}</span>
        </div>
        <div
            className={'dc-meter-track'}
            role={'meter'}
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage(value, limit)}
            aria-valuetext={text}
        >
            <span style={{ width: `${percentage(value, limit)}%` }} />
        </div>
    </div>
);
