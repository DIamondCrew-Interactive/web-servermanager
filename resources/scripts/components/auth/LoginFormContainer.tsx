import React, { forwardRef } from 'react';
import { Form } from 'formik';
import FlashMessageRender from '@/components/FlashMessageRender';
import Brand from '@/components/branding/Brand';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <div className={'dc-auth'}>
        <div className={'dc-auth__brand'}>
            <Brand large />
        </div>
        {title && <h2 css={tw`text-center text-neutral-100 font-medium py-4`}>{title}</h2>}
        <FlashMessageRender css={tw`mb-2 px-1`} />
        <Form {...props} ref={ref}>
            <div className={'dc-auth__form'}>{props.children}</div>
        </Form>
        <p css={tw`text-center text-neutral-300 text-xs mt-6`}>
            &copy; {new Date().getFullYear()} DiamondCrew Interactive
        </p>
    </div>
));
