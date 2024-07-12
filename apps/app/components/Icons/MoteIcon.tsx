import * as React from 'react';

type Props = {
    /** The size of the icon, 24px is default to match standard icons */
    size?: number;
    /** The color of the icon, defaults to the current text color */
    color?: string;
    /** Whether the safe area should be removed and have graphic across full size */
    cover?: boolean;
};

export function MoteIcon({ size = 24, cover, color = 'currentColor' }: Props) {
    return <img src="/images/favicon-32.png" />;
}
