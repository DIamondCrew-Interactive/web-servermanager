import styled from 'styled-components/macro';
import tw, { theme } from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full bg-neutral-900 border-b border-neutral-600 overflow-x-auto`};

    & > div {
        ${tw`flex items-center text-sm mx-auto px-2`};
        max-width: 1200px;

        & > a,
        & > div {
            ${tw`inline-block py-3 px-4 text-neutral-300 no-underline whitespace-nowrap transition-all duration-150`};

            &:not(:first-of-type) {
                ${tw`ml-2`};
            }

            &:hover {
                ${tw`text-neutral-100`};
            }

            &:active,
            &.active {
                ${tw`text-diamondcrew-pink`};
                background: linear-gradient(100deg, #ef45b514, transparent);
                box-shadow: inset 0 -2px ${theme`colors.diamondcrew.pink`.toString()};
            }
        }
    }
`;

export default SubNavigation;
