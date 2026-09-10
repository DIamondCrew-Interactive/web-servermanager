import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import Icon, { IconName } from './Icons';

const adminLinks: [string, string, IconName][] = [
    ['/admin/servers', 'Servers', 'server'],
    ['/admin/users', 'Users', 'users'],
    ['/admin/nodes', 'Nodes', 'cpu'],
    ['/admin/locations', 'Locations', 'globe'],
    ['/admin/nests', 'Nests & Eggs', 'cube'],
    ['/admin/settings', 'Settings', 'settings'],
    ['/admin/databases', 'Databases', 'database'],
];
export default ({ open, onClose, onLogout }: { open: boolean; onClose: () => void; onLogout: () => void }) => {
    const admin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    return (
        <>
            {open && <button className={'dc-sidebar-backdrop'} aria-label={'Close navigation'} onClick={onClose} />}
            <aside id={'dc-sidebar'} className={`dc-sidebar${open ? ' is-open' : ''}`}>
                <nav aria-label={'Main navigation'} onClick={onClose}>
                    <NavLink to={'/'} exact>
                        <Icon name={'home'} />
                        Dashboard
                    </NavLink>
                    {admin ? (
                        adminLinks.map(([url, title, icon]) => (
                            <a href={url} key={url}>
                                <Icon name={icon} />
                                {title}
                            </a>
                        ))
                    ) : (
                        <a href={'/#server-overview'}>
                            <Icon name={'server'} />
                            Servers
                        </a>
                    )}
                    <div className={'dc-sidebar-label'}>
                        System
                        <span />
                    </div>
                    <NavLink to={'/account/activity'}>
                        <Icon name={'activity'} />
                        Activity
                    </NavLink>
                    <NavLink to={'/account/api'}>
                        <Icon name={'code'} />
                        API Credentials
                    </NavLink>
                    <NavLink to={'/account'} exact>
                        <Icon name={'settings'} />
                        Account
                    </NavLink>
                    <a href={'https://pterodactyl.io/panel/1.0/'} target={'_blank'} rel={'noreferrer'}>
                        <Icon name={'book'} />
                        Documentation
                    </a>
                    <a href={'https://pterodactyl.io/community/about.html'} target={'_blank'} rel={'noreferrer'}>
                        <Icon name={'support'} />
                        Support
                    </a>
                    <button onClick={onLogout}>
                        <Icon name={'logout'} />
                        Sign Out
                    </button>
                </nav>
                <div className={'dc-sidebar-brand'}>
                    <img src={'/branding/diamondcrew/diamond-circle-logo.png'} width={74} height={74} alt={''} />
                    <span className={'dc-gradient-text'}>
                        DiamondCrew
                        <br />
                        Interactive
                    </span>
                    <small>
                        GAME SERVERS
                        <br />
                        WITHOUT LIMITS
                    </small>
                </div>
            </aside>
        </>
    );
};
