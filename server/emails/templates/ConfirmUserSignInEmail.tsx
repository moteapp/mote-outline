import * as React from 'react';
import { Client } from '@shared/types';
import env from '@server/env';
import Logger from '@server/logging/Logger';
import BaseEmail, { EmailProps } from './BaseEmail';
import Body from './components/Body';
import Button from './components/Button';
import CopyableCode from './components/CopyableCode';
import EmailTemplate from './components/EmailLayout';
import EmptySpace from './components/EmptySpace';
import Footer from './components/Footer';
import Header from './components/Header';
import Heading from './components/Heading';

type Props = EmailProps & {
    confirmationCode: string;
    token: string;
    teamUrl: string;
    client: Client;
};

/**
 * Email sent to a user when they request to delete their account.
 */
export default class ConfirmUserSignInEmail extends BaseEmail<Props> {
    protected subject() {
        return `Welcome to ${env.APP_NAME}! Your Sign In Code`;
    }

    protected preview() {
        return `Here’s your code to signin to ${env.APP_NAME}.`;
    }

    protected renderAsText({ confirmationCode }: Props): string {
        return `
Sign in to ${env.APP_NAME}.

Code: ${confirmationCode}
`;
    }

    protected render({ confirmationCode, token, client }: Props) {
        if (env.isDevelopment) {
            Logger.debug('email', `Sign-Up code: ${confirmationCode}`);
        }

        return (
            <EmailTemplate previewText={this.preview()}>
                <Header />

                <Body>
                    <Heading>Sign in to ${env.APP_NAME}</Heading>
                    <p>Copy and paste your temporary verification code.</p>
                    <EmptySpace height={5} />
                    <p>
                        <CopyableCode>{confirmationCode}</CopyableCode>
                    </p>

                    <EmptySpace height={10} />
                    <p>
                        <Button href={this.signinLink(token, client)}>
                            Sign in with Magic Link
                        </Button>
                    </p>
                </Body>

                <Footer />
            </EmailTemplate>
        );
    }

    private signinLink(token: string, client: Client): string {
        return `${env.URL}/auth/magiclink.callback?token=${token}&client=${client}`;
    }
}
