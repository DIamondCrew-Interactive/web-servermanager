import React, { useEffect } from 'react';
import ContentContainer from '@/components/elements/ContentContainer';
import { CSSTransition } from 'react-transition-group';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';
import { BRAND_NAME } from '@/components/branding/Brand';

export interface PageContentBlockProps {
    title?: string;
    className?: string;
    showFlashKey?: string;
}

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, showFlashKey, className, children }) => {
    useEffect(() => {
        document.title = title ? `${title} | ${BRAND_NAME}` : BRAND_NAME;
    }, [title]);

    return (
        <CSSTransition timeout={150} classNames={'fade'} appear in>
            <>
                <ContentContainer css={tw`my-4 sm:my-10`} className={`dc-page ${className || ''}`}>
                    {showFlashKey && <FlashMessageRender byKey={showFlashKey} css={tw`mb-4`} />}
                    {children}
                </ContentContainer>
                <ContentContainer css={tw`mb-4`} className={'dc-page-footer'}>
                    <p className={'dc-footer'}>
                        <span>
                            &copy; {new Date().getFullYear()}{' '}
                            <span className={'dc-gradient-text'}>DiamondCrew Interactive.</span> All rights reserved.
                        </span>
                        <span>
                            Powered by <span className={'dc-gradient-text'}>DiamondCrew</span> Server Manager{' '}
                            <img
                                src={'/branding/diamondcrew/diamond-circle-logo.png'}
                                width={32}
                                height={32}
                                alt={''}
                            />
                        </span>
                    </p>
                </ContentContainer>
            </>
        </CSSTransition>
    );
};

export default PageContentBlock;
