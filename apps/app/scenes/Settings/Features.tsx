import { observer } from 'mobx-react';
import { BeakerIcon } from 'outline-icons';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TeamPreference } from '@shared/types';
import ConfirmationDialog from '~/components/ConfirmationDialog';
import Heading from '~/components/Heading';
import Scene from '~/components/Scene';
import Switch from '~/components/Switch';
import Text from '~/components/Text';
import env from "~/env";
import useCurrentTeam from '~/hooks/useCurrentTeam';
import useStores from '~/hooks/useStores';
import SettingRow from './components/SettingRow';

function Features() {
    const team = useCurrentTeam();
    const { dialogs } = useStores();
    const { t } = useTranslation();

    const handleOpenConfirmation = () => {
        dialogs.openModal({
            title: t('AI answers'),
            content: (
                <ConfirmationDialog
                    onSubmit={async () => {
                        team.setPreference(TeamPreference.AIAnswers, true);
                        await team.save();
                        dialogs.closeAllModals();
                        toast.success(t('Settings saved'));
                    }}
                >
                    <p>
                        By enabling this feature you agree that workspace
                        content and search queries may be sent to{' '}
                        <a
                            target="_blank"
                            rel="nofollow noreferrer"
                            href="https://openai.com"
                        >
                            OpenAI
                        </a>{' '}
                        for processing. Data is not stored or used for training
                        purposes – please review{' '}
                        <a
                            target="_blank"
                            rel="nofollow noreferrer"
                            href="https://openai.com/enterprise-privacy"
                        >
                            OpenAI&#39;s privacy agreement
                        </a>
                        .
                    </p>
                    <p>
                        Once enabled, indexing documents will take a few
                        minutes. You will receive an email once complete.
                    </p>
                </ConfirmationDialog>
            ),
        });
    };

    const handlePreferenceChange =
        (inverted = false) =>
        async (ev: React.ChangeEvent<HTMLInputElement>) => {
            team.setPreference(
                ev.target.name as TeamPreference,
                inverted ? !ev.target.checked : ev.target.checked
            );
            await team.save();
            toast.success(t('Settings saved'));
        };

    return (
        <Scene title={t('Features')} icon={<BeakerIcon />}>
            <Heading>{t('Features')}</Heading>
            <Text as="p" type="secondary">
                <Trans>
                    Manage optional and beta features. Changing these settings
                    will affect the experience for all members of the workspace.
                </Trans>
            </Text>
            <SettingRow
                name={TeamPreference.SeamlessEdit}
                label={t('Separate editing')}
                description={t(
                    `When enabled documents have a separate editing mode by default instead of being always editable. This setting can be overridden by user preferences.`
                )}
            >
                <Switch
                    id={TeamPreference.SeamlessEdit}
                    name={TeamPreference.SeamlessEdit}
                    checked={!team.getPreference(TeamPreference.SeamlessEdit)}
                    onChange={handlePreferenceChange(true)}
                />
            </SettingRow>
            <SettingRow
                name={TeamPreference.Commenting}
                label={t('Commenting')}
                description={t(
                    'When enabled team members can add comments to documents.'
                )}
            >
                <Switch
                    id={TeamPreference.Commenting}
                    name={TeamPreference.Commenting}
                    checked={team.getPreference(TeamPreference.Commenting)}
                    onChange={handlePreferenceChange(false)}
                />
            </SettingRow>
            {env.VSS_ENABLED && (
                <SettingRow
                    name={TeamPreference.AIAnswers}
                    label={t('AI answers')}
                    description={t(
                        'Use AI to directly answer searched questions using content in your workspace.'
                    )}
                >
                    {' '}
                    <Switch
                        id={TeamPreference.AIAnswers}
                        name={TeamPreference.AIAnswers}
                        checked={team.getPreference(TeamPreference.AIAnswers)}
                        onChange={(ev: any) => {
                            if (ev.target.checked) {
                                handleOpenConfirmation();
                            } else {
                                void handlePreferenceChange(false)(ev);
                            }
                        }}
                    />
                </SettingRow>
            )}
        </Scene>
    );
}

export default observer(Features);
