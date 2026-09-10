import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage from '@/api/server/getServerResourceUsage';
import { PaginatedResult } from '@/api/http';
import { useActivityLogs } from '@/api/account/activity';
import { bytesToString, mbToBytes } from '@/lib/formatters';
import Pagination from '@/components/elements/Pagination';
import ServerRow from '@/components/dashboard/ServerRow';
import Icon, { IconName } from '@/components/branding/Icons';
import { serverArtwork } from '@/components/branding/serverArtwork';
import Meter from './Meter';
import NetworkChart from './NetworkChart';
import { Sample, networkRate } from './metrics';

export default ({
    servers,
    onPageSelect,
    showOnlyAdmin,
}: {
    servers: PaginatedResult<Server>;
    onPageSelect: (page: number) => void;
    showOnlyAdmin: boolean;
}) => {
    const [samples, setSamples] = useState<Sample[]>([]);
    const { data: activity, error: activityError } = useActivityLogs(
        { page: 1, sorts: { timestamp: -1 } },
        { revalidateOnMount: true, refreshInterval: 60000 }
    );
    const ids = servers.items.map((s) => `${s.uuid}:${s.status}:${s.isNodeUnderMaintenance}`).join(',');
    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;
        const poll = async () => {
            if (!document.hidden) {
                const entries = await Promise.all(
                    servers.items.map(async (server) => {
                        if (server.status === 'suspended' || server.isNodeUnderMaintenance)
                            return [server.uuid, null] as const;
                        try {
                            return [server.uuid, await getServerResourceUsage(server.uuid)] as const;
                        } catch {
                            return [server.uuid, null] as const;
                        }
                    })
                );
                if (!cancelled)
                    setSamples((previous) => [
                        ...previous.slice(-39),
                        { at: Date.now(), stats: Object.fromEntries(entries) },
                    ]);
            }
            if (!cancelled) timer = setTimeout(poll, 30000);
        };
        setSamples([]);
        poll();
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [ids]);
    const latest = samples[samples.length - 1];
    const stats = latest?.stats || {};
    const reporting = servers.items.filter((s) => !!stats[s.uuid]);
    const sum = (get: (server: Server) => number) => reporting.reduce((total, server) => total + get(server), 0);
    const cpu = sum((s) => stats[s.uuid]!.cpuUsagePercent),
        memory = sum((s) => stats[s.uuid]!.memoryUsageInBytes),
        disk = sum((s) => stats[s.uuid]!.diskUsageInBytes);
    const limits = {
        cpu: sum((s) => s.limits.cpu),
        memory: mbToBytes(sum((s) => s.limits.memory)),
        disk: mbToBytes(sum((s) => s.limits.disk)),
    };
    const unlimited = (key: 'cpu' | 'memory' | 'disk') => reporting.some((s) => s.limits[key] === 0);
    const points = samples.slice(1).map((sample, index) => networkRate(samples[index], sample));
    const rate = points[points.length - 1];
    const tiles: { icon: IconName; color: string; value: number | string; label: string; detail: string }[] = [
        {
            icon: 'server',
            color: 'blue',
            value: servers.pagination.total,
            label: 'Servers',
            detail: 'Accessible in this view',
        },
        {
            icon: 'play',
            color: 'pink',
            value: latest ? reporting.filter((s) => stats[s.uuid]?.status === 'running').length : '—',
            label: 'Running',
            detail: 'On this page',
        },
        {
            icon: 'cpu',
            color: 'cyan',
            value: new Set(servers.items.map((s) => s.node)).size,
            label: 'Nodes',
            detail: 'On this page',
        },
        {
            icon: 'cube',
            color: 'purple',
            value: new Set(servers.items.map((s) => serverArtwork(s).game)).size,
            label: 'Server Types',
            detail: 'On this page',
        },
    ];
    return (
        <>
            <div className={'dc-summary-grid'}>
                {tiles.map((tile) => (
                    <div className={'dc-summary-card'} key={tile.label} title={tile.detail}>
                        <Icon name={tile.icon} className={`dc-${tile.color}`} />
                        <div>
                            <strong>{tile.value}</strong>
                            <span>{tile.label}</span>
                            <small>{tile.detail}</small>
                        </div>
                    </div>
                ))}
            </div>
            <div className={'dc-overview-grid'}>
                <section className={'dc-panel dc-server-panel'} id={'server-overview'}>
                    <div className={'dc-panel-heading'}>
                        <h2>
                            <Icon name={'server'} />
                            Server Overview
                        </h2>
                        <a href={'#server-overview'}>
                            Your Servers <Icon name={'arrow'} />
                        </a>
                    </div>
                    <Pagination data={servers} onPageSelect={onPageSelect}>
                        {({ items }) =>
                            items.length ? (
                                <div className={'dc-server-list'}>
                                    {items.map((server) => (
                                        <ServerRow key={server.uuid} server={server} stats={stats[server.uuid]} />
                                    ))}
                                </div>
                            ) : (
                                <p className={'dc-empty'}>
                                    {showOnlyAdmin
                                        ? 'There are no other servers to display.'
                                        : 'There are no servers associated with your account.'}
                                </p>
                            )
                        }
                    </Pagination>
                </section>
                <section className={'dc-panel dc-system-panel'}>
                    <div className={'dc-panel-heading'}>
                        <h2>
                            <Icon name={'cpu'} />
                            System Overview
                        </h2>
                    </div>
                    <p className={'dc-panel-caption'}>
                        Servers on this page · {reporting.length}/{servers.items.length} reporting
                    </p>
                    {(
                        [
                            ['cpu', 'CPU', cpu, limits.cpu, `${cpu.toFixed(1)}%`, `${limits.cpu}%`, 'pink'],
                            [
                                'database',
                                'Memory',
                                memory,
                                limits.memory,
                                bytesToString(memory),
                                bytesToString(limits.memory),
                                'purple',
                            ],
                            [
                                'backup',
                                'Disk',
                                disk,
                                limits.disk,
                                bytesToString(disk),
                                bytesToString(limits.disk),
                                'blue',
                            ],
                        ] as const
                    ).map(([icon, title, value, limit, text, limitText, color]) => (
                        <div className={'dc-system-row'} key={title}>
                            <Icon name={icon} className={`dc-${color}`} />
                            <div>
                                <Meter
                                    label={title}
                                    value={value}
                                    limit={unlimited(title.toLowerCase() as 'cpu' | 'memory' | 'disk') ? 0 : limit}
                                    text={reporting.length ? text : '—'}
                                />
                                <small>
                                    {unlimited(title.toLowerCase() as 'cpu' | 'memory' | 'disk')
                                        ? 'Includes unlimited allocation'
                                        : `of ${limitText} allocated`}
                                </small>
                            </div>
                        </div>
                    ))}
                    <div className={'dc-system-row'}>
                        <Icon name={'network'} />
                        <div>
                            <div className={'dc-network-value'}>
                                <span>Network</span>
                                <strong>
                                    {rate && rate.rx !== null && rate.tx !== null
                                        ? `${bytesToString(rate.rx + rate.tx)}/s`
                                        : '—'}
                                </strong>
                            </div>
                            <small>Inbound / Outbound · 30s samples</small>
                        </div>
                    </div>
                </section>
                <section className={'dc-panel dc-activity-panel'}>
                    <div className={'dc-panel-heading'}>
                        <h2>
                            <Icon name={'activity'} />
                            Recent Activity
                        </h2>
                        <Link to={'/account/activity'}>
                            View All Activity <Icon name={'arrow'} />
                        </Link>
                    </div>
                    <p className={'dc-panel-caption'}>Your account activity</p>
                    {activityError ? (
                        <p className={'dc-empty'}>
                            Activity could not be loaded. <Link to={'/account/activity'}>Open activity log</Link>
                        </p>
                    ) : !activity ? (
                        <p className={'dc-empty'}>Loading activity…</p>
                    ) : activity.items.length ? (
                        activity.items.slice(0, 4).map((entry) => (
                            <Link to={'/account/activity'} className={'dc-activity-row'} key={entry.id}>
                                <span className={'dc-activity-icon'}>
                                    <Icon name={entry.event.includes('login') ? 'users' : 'activity'} />
                                </span>
                                <span>
                                    <strong>{entry.description || entry.event.replace(/[:._-]/g, ' ')}</strong>
                                    <small>{entry.relationships.actor?.username || 'System'}</small>
                                </span>
                                <time dateTime={entry.timestamp.toISOString()}>
                                    {formatDistanceToNowStrict(entry.timestamp, { addSuffix: true })}
                                </time>
                            </Link>
                        ))
                    ) : (
                        <p className={'dc-empty'}>No recent account activity.</p>
                    )}
                </section>
                <section className={'dc-panel dc-network-panel'}>
                    <div className={'dc-panel-heading'}>
                        <h2>
                            <Icon name={'chart'} />
                            Network Overview
                        </h2>
                        <span className={'dc-live-label'}>Live Data</span>
                    </div>
                    <NetworkChart points={points} />
                    <p className={'dc-panel-caption'}>Servers on this page · current session</p>
                </section>
            </div>
        </>
    );
};
