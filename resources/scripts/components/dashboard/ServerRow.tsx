import React from 'react';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import { ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import Icon from '@/components/branding/Icons';
import { serverArtwork } from '@/components/branding/serverArtwork';
import Meter from './diamondcrew/Meter';

export default ({ server, stats }: { server: Server; stats: ServerStats | null | undefined }) => {
    const art = serverArtwork(server);
    const state =
        server.status === 'suspended' || stats?.isSuspended
            ? 'Suspended'
            : server.isNodeUnderMaintenance
            ? 'Under Maintenance'
            : server.isTransferring
            ? 'Transferring'
            : server.status === 'installing'
            ? 'Installing'
            : server.status === 'restoring_backup'
            ? 'Restoring Backup'
            : server.status
            ? 'Unavailable'
            : stats === null
            ? 'Connection Error'
            : !stats
            ? 'Connecting'
            : { running: 'Running', offline: 'Offline', starting: 'Starting', stopping: 'Stopping' }[stats.status];
    const available =
        stats && !server.status && !server.isNodeUnderMaintenance && !server.isTransferring && !stats.isSuspended;
    const allocation = server.allocations.find((a) => a.isDefault);
    return (
        <Link to={`/server/${server.id}`} className={'dc-server-row'}>
            <img
                className={'dc-server-art'}
                src={art.image}
                alt={art.label}
                width={76}
                height={76}
                onError={(event) => {
                    const image = event.currentTarget;
                    if (!image.src.endsWith('/games/generic.svg'))
                        image.src = '/branding/diamondcrew/games/generic.svg';
                }}
            />
            <div className={'dc-server-info'}>
                <h3>{server.name}</h3>
                <div className={'dc-server-meta'}>
                    <span
                        className={`dc-status dc-status--${
                            state === 'Running'
                                ? 'online'
                                : state === 'Offline' || state === 'Suspended' || state === 'Connection Error'
                                ? 'offline'
                                : 'pending'
                        }`}
                    >
                        <i />
                        {state}
                    </span>
                    <span>{art.label}</span>
                </div>
                <p className={'dc-server-address'}>
                    <Icon name={'server'} />
                    {allocation ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}` : 'No allocation'}
                </p>
                {server.description && (
                    <p className={'dc-server-description'} title={server.description}>
                        {server.description}
                    </p>
                )}
            </div>
            <div className={'dc-server-meters'}>
                {available ? (
                    <>
                        <Meter
                            label={'CPU'}
                            value={stats.cpuUsagePercent}
                            limit={server.limits.cpu}
                            text={`${stats.cpuUsagePercent.toFixed(1)}% / ${server.limits.cpu || 'Unlimited'}${
                                server.limits.cpu ? '%' : ''
                            }`}
                        />
                        <Meter
                            label={'Memory'}
                            value={stats.memoryUsageInBytes}
                            limit={mbToBytes(server.limits.memory)}
                            text={`${bytesToString(stats.memoryUsageInBytes)} / ${
                                server.limits.memory ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited'
                            }`}
                        />
                        <p className={'dc-row-disk'}>
                            Disk {bytesToString(stats.diskUsageInBytes)} /{' '}
                            {server.limits.disk ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited'}
                        </p>
                    </>
                ) : (
                    <p className={'dc-empty'}>{state}</p>
                )}
            </div>
        </Link>
    );
};
