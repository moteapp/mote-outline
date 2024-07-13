import { observer } from 'mobx-react';
import { QuestionMarkIcon, ThumbsDownIcon, ThumbsUpIcon } from 'outline-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { basicExtensions, listExtensions } from '@shared/editor/nodes';
import CodeBlock from '@shared/editor/nodes/CodeBlock';
import CodeFence from '@shared/editor/nodes/CodeFence';
import { s } from '@shared/styles';
import Document from '~/models/Document';
import ErrorBoundary from '~/components/ErrorBoundary';
import Fade from '~/components/Fade';
import Flex from '~/components/Flex';
import NudeButton from '~/components/NudeButton';
import { ResizingHeightContainer } from '~/components/ResizingHeightContainer';
import Tooltip from '~/components/Tooltip';
import Editor from '~/editor';
import useDictionary from '~/hooks/useDictionary';
import useEditorClickHandlers from '~/hooks/useEditorClickHandlers';
import useRequest from '~/hooks/useRequest';
import useStores from '~/hooks/useStores';
import { client } from '~/utils/ApiClient';
import isCloudHosted from '~/utils/isCloudHosted';

type Props = { query: string; collectionId?: string; showReferences?: boolean };

const SuggestedAnswer = ({ query, collectionId, showReferences }: Props) => {
    const { t } = useTranslation();
    const { documents, searches } = useStores();
    const dictionary = useDictionary();
    const theme = useTheme();
    const { handleClickLink } = useEditorClickHandlers({});
    const {
        data: response,
        loading,
        request,
    } = useRequest(() =>
        client.post('/documents.answerQuestion', { query, collectionId })
    );
    const extensions = React.useMemo(
        () => [...basicExtensions, ...listExtensions, CodeBlock, CodeFence],
        []
    );
    React.useEffect(() => {
        void request();
    }, [query]);
    React.useEffect(() => {
        if (response) {
            searches.add(response.data.search);
        }
    }, [searches, response]);
    const references = React.useMemo(
        () =>
            response?.data.documents.map((d: Document) => documents.add(d)) ??
            [],
        [documents, response]
    );
    if (loading || response) {
        return (
            <>
                <Fade>
                    <Answer>
                        <Tooltip
                            content={t(
                                'AI generated answer based on related documents in your workspace'
                            )}
                        >
                            <IconWrapper>
                                <StyledQuestionMarkIcon
                                    size={32}
                                    color={theme.placeholder}
                                />
                            </IconWrapper>
                        </Tooltip>
                        <ResizingHeightContainer
                            style={{ width: '100%' }}
                            hideOverflow
                        >
                            {loading ? (
                                'Generating answer…'
                            ) : (
                                <Flex column gap={16}>
                                    <ErrorBoundary>
                                        <Editor
                                            readOnly
                                            embeds={[]}
                                            extensions={extensions}
                                            defaultValue={
                                                response.data.search.answer
                                            }
                                            dictionary={dictionary}
                                            onClickLink={handleClickLink}
                                            placeholder=""
                                        />
                                    </ErrorBoundary>
                                    {showReferences &&
                                        references.length > 0 && (
                                            <References>
                                                {t('References')} {': '}
                                                {references.map(
                                                    (
                                                        document: Document,
                                                        index: number
                                                    ) => (
                                                        <>
                                                            {index > 0 && ', '}
                                                            <DocumentLink
                                                                key={
                                                                    document.id
                                                                }
                                                                to={{
                                                                    pathname:
                                                                        document.path,
                                                                    state: {
                                                                        title: document.title,
                                                                    },
                                                                }}
                                                            >
                                                                {document.title}
                                                            </DocumentLink>
                                                        </>
                                                    )
                                                )}
                                            </References>
                                        )}
                                </Flex>
                            )}
                        </ResizingHeightContainer>
                        {!loading && (
                            <Vote searchId={response.data.search?.id} />
                        )}
                    </Answer>
                </Fade>
            </>
        );
    }
    return null;
};
const References = styled.div`
    font-size: 14px;
`;
const DocumentLink = styled(Link)`
    color: ${s('textSecondary')};
    font-weight: 500;
    &:hover {
        color: ${s('text')};
        text-decoration: underline;
    }
`;
const Vote = observer(({ searchId }: { searchId: string }) => {
    const { searches } = useStores();
    const theme = useTheme();
    const search = searches.get(searchId);
    if (!search || !isCloudHosted) {
        return null;
    }
    const handleVote = (score: number) => async () => {
        if (search.score === score) {
            return;
        }
        search.score = score;
        await search.save();
    };
    return (
        <VoteButtons>
            <Tooltip content="Good answer" delay={250}>
                <VoteButton onClick={handleVote(1)}>
                    <ThumbsUpIcon
                        color={search.score === 1 ? theme.text : undefined}
                    />
                </VoteButton>
            </Tooltip>
            <Tooltip content="Bad answer" delay={250}>
                <VoteButton onClick={handleVote(-1)}>
                    <ThumbsDownIcon
                        color={search.score === -1 ? theme.text : undefined}
                    />
                </VoteButton>
            </Tooltip>
        </VoteButtons>
    );
});
const StyledQuestionMarkIcon = styled(QuestionMarkIcon)`
    flex-shrink: 0;
    margin-top: 2px;
`;
const Answer = styled(Flex)`
    font-size: 22px;
    min-height: 60px;
    background: ${s('sidebarBackground')};
    color: ${s('sidebarText')};
    padding: 12px;
    margin: 1em 0;
    border-radius: 8px;
    gap: 8px;
`;
const VoteButtons = styled(Flex)`
    align-self: flex-end;
    align-items: center;
    flex-shrink: 0;
    height: 32px;
`;
const VoteButton = styled(NudeButton)`
    color: ${s('placeholder')};
    &:hover {
        color: ${s('text')};
    }
`;
const IconWrapper = styled.div`
    width: 32px;
    height: 32px;
`;

export default observer(SuggestedAnswer);
