import React from 'react';
import BaseEmail from '@server/emails/templates/BaseEmail';
import Body from '@server/emails/templates/components/Body';
import Button from '@server/emails/templates/components/Button';
import EmailLayout from '@server/emails/templates/components/EmailLayout';
import Header from '@server/emails/templates/components/Header';
import Heading from '@server/emails/templates/components/Heading';

interface EmailProps {
    teamUrl: string;
    userId: string;
    to: string | null;
}

export class SearchEmbeddingsCompleteEmail extends BaseEmail<EmailProps, any> {
    subject() {
        return 'Search indexing complete';
    }

    preview() {
        return 'Search indexing complete';
    }

    renderAsText(_ref: any) {
        const { teamUrl } = _ref;
        return "\nSearch indexing complete\n\nWe've finished indexing your documents. AI-owered answers will now\nbe available for relevant searches in your workspace.\n\nGo to search: ".concat(
            teamUrl,
            '/search\n'
        );
    }

    render(props: any) {
        const { teamUrl } = props;
        const searchLink = ''.concat(teamUrl, '/search?ref=notification-email');

        return (
            <EmailLayout previewText={this.preview()}>
                <Header />
                <Body>
                    <Heading>Search indexing complete</Heading>
                    <p>
                        We've finished indexing your documents. AI-powered
                        answers will now be available for relevant searches in
                        your workspace.
                    </p>
                    <p>
                        <Button href={searchLink}>Go to search</Button>
                    </p>
                </Body>
            </EmailLayout>
        );
    }
}
