import React from 'react';

export const BRAND_NAME = 'DiamondCrew Server Manager';

const Brand = ({ large = false }: { large?: boolean }) => (
    <span className={`dc-brand${large ? ' dc-brand--large' : ''}`}>
        <img src={'/branding/diamondcrew/diamond-circle-logo.png'} width={52} height={52} alt={''} />
        <span className={'dc-brand__copy'}>
            <span className={'dc-brand__name'}>DiamondCrew</span>
            <span className={'dc-brand__subtitle'}>Server Manager</span>
        </span>
    </span>
);

export default Brand;
