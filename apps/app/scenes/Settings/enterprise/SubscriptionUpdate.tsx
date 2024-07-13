import { observer } from 'mobx-react';
import * as React from 'react';
import { toast } from 'sonner';
import Button from '~/components/Button';
import Flex from '~/components/Flex';
import Input from '~/components/Input';
import Text from '~/components/Text';
import useCurrentTeam from '~/hooks/useCurrentTeam';
import useStores from '~/hooks/useStores';

type Props = { onSubmit: () => void };
function SubscriptionUpdate({ onSubmit }: Props) {
    const { billing } = useStores();
    const team = useCurrentTeam();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [email, setEmail] = React.useState(team.billingEmail);
    const handleChangeEmail = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setEmail(event.target.value);
        },
        []
    );
    const handleSubmit = React.useCallback(
        async (ev: React.FormEvent<any>) => {
            ev.preventDefault();
            setIsSubmitting(true);
            try {
                await billing.updateSubscription({ email });
                onSubmit();
            } catch (err) {
                toast.error(err.message);
            } finally {
                setIsSubmitting(false);
            }
        },
        [billing, onSubmit, email]
    );
    return (
        <Flex column>
            <form onSubmit={handleSubmit}>
                <Text type="secondary" size="small" as="p">
                    Update that email address that will be used to send payment
                    receipts and notices in the case of failures or changes.
                </Text>
                <Input
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleChangeEmail}
                    placeholder="ap@company.com"
                    autoFocus
                />
                <Flex justify="flex-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving…' : 'Save'}
                    </Button>
                </Flex>
            </form>
        </Flex>
    );
}

export default observer(SubscriptionUpdate);
