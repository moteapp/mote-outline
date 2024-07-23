import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import ButtonLarge from '~/components/ButtonLarge';
import InputLarge from '~/components/InputLarge';
import env from '~/env';
import { client } from '~/utils/ApiClient';
import Desktop from '~/utils/Desktop';

export type OTPAuthenticationProps = {
    emailLinkSentTo: string;
};

export function OTPAuthentication({ emailLinkSentTo }: OTPAuthenticationProps) {
    const { t } = useTranslation();
    const [code, setCode] = React.useState('');
    const [isSubmitting, setSubmitting] = React.useState(false);
    const history = useHistory();

    const handleChangeCode = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCode(event.target.value);
    };

    const handleSubmitCode = async (
        event: React.SyntheticEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        let response;

        if (code && code.length === 6) {
            setSubmitting(true);

            try {
                response = await client.get(event.currentTarget.action, {
                    code,
                    email: emailLinkSentTo,
                    client: Desktop.isElectron() ? 'desktop' : undefined,
                });
            } finally {
                setSubmitting(false);
                if (response === undefined) {
                    window.location.href = '/home';
                }
            }
        }
    };

    return (
        <Form
            method="GET"
            action={'/auth/otp.callback'}
            onSubmit={handleSubmitCode}
        >
            <InputLarge
                type="text"
                name="code"
                placeholder="123456"
                value={code}
                onChange={handleChangeCode}
                disabled={isSubmitting}
                autoFocus
                required
                short
            />
            <ButtonLarge type="submit" disabled={isSubmitting}>
                {t('Sign In')} →
            </ButtonLarge>
        </Form>
    );
}

const Form = styled.form`
    width: 100%;
    display: flex;
    justify-content: space-between;
`;
