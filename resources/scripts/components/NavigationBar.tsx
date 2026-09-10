import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Brand from '@/components/branding/Brand';
import Sidebar from '@/components/branding/Sidebar';
import Icon from '@/components/branding/Icons';

export default () => {
    const user = useStoreState((state: ApplicationStore) => state.user.data!);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();
    useEffect(() => {
        document.body.classList.add('dc-shell');
        return () => document.body.classList.remove('dc-shell');
    }, []);
    useEffect(() => setOpen(false), [pathname]);
    useEffect(() => {
        const close = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', close);
        return () => window.removeEventListener('keydown', close);
    }, []);
    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            window.location.assign('/');
        });
    };
    return (
        <>
            <header className={'dc-header'}>
                <SpinnerOverlay visible={isLoggingOut} />
                <button
                    className={'dc-menu-toggle'}
                    aria-label={'Toggle navigation'}
                    aria-controls={'dc-sidebar'}
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                >
                    <Icon name={open ? 'close' : 'menu'} />
                </button>
                <Link to={'/'} className={'dc-header-brand'}>
                    <Brand />
                </Link>
                <SearchContainer />
                <div className={'dc-header-account'}>
                    <Link
                        to={'/account/activity'}
                        className={'dc-header-activity'}
                        aria-label={'Account activity'}
                        title={'Account activity'}
                    >
                        <Icon name={'bell'} />
                    </Link>
                    <Link to={'/account'} className={'dc-user'}>
                        <span className={'dc-avatar'}>{user.username.slice(0, 2).toUpperCase()}</span>
                        <span className={'dc-user-copy'}>
                            <strong>{user.username}</strong>
                            <small>{user.rootAdmin ? 'Administrator' : 'Server Manager'}</small>
                        </span>
                        <Icon name={'chevron'} />
                    </Link>
                    <button
                        onClick={onTriggerLogout}
                        className={'dc-logout'}
                        aria-label={'Sign Out'}
                        title={'Sign Out'}
                    >
                        <Icon name={'logout'} />
                    </button>
                </div>
                <div className={'dc-header-art'} aria-hidden={'true'}>
                    <span>
                        PLAY
                        <br />
                        CREATE
                        <br />
                        TOGETHER
                    </span>
                </div>
            </header>
            <Sidebar open={open} onClose={() => setOpen(false)} onLogout={onTriggerLogout} />
        </>
    );
};
