import { t } from 'i18next';
import Router from 'koa-router';
import { TeamPreference } from '@shared/types';
import { ValidationError } from '@server/errors';
import auth from '@server/middlewares/authentication';
import { rateLimiter } from '@server/middlewares/rateLimiter';
import validate from '@server/middlewares/validate';
import { Collection, SearchQuery, User, Document } from '@server/models';
import { authorize } from '@server/policies';
import {
    presentDocument,
    presentPolicies,
    presentSearchQuery,
} from '@server/presenters';
import * as T from '@server/routes/api/documents/schema';
import { APIContext } from '@server/types';
import { RateLimiterStrategy } from '@server/utils/RateLimiter';
import * as i18n from '@server/utils/i18n';
import { SearchIndex } from '../searchIndex';

const router = new Router();

router.post(
    'documents.answerQuestion',
    auth(),
    rateLimiter(RateLimiterStrategy.TenPerMinute),
    validate(T.DocumentsSearchSchema),
    async (ctx: APIContext<any>) => {
        const { user } = ctx.state.auth;
        const { query, collectionId, dateFilter } = ctx.input.body;

        if (!user.team.getPreference(TeamPreference.AIAnswers)) {
            throw ValidationError('Answers are not enabled for this team.');
        }

        if (collectionId) {
            const collection = await Collection.scope({
                method: ['withMembership', user.id],
            }).findByPk(collectionId);
            authorize(user, 'readDocument', collection);
        }

        const { answer, documents } = await SearchIndex.suggestAnswer(
            user,
            query,
            {
                collectionId,
                dateFilter,
            }
        );

        const [search] = await SearchQuery.findOrCreate({
            where: {
                query,
                userId: user.id,
                teamId: user.teamId,
            },
            defaults: {
                source: ctx.state.auth.type || 'app',
                results: 0,
            },
            order: [['createdAt', 'DESC']],
        });

        if (search) {
            if (answer) {
                search.answer = answer;
                await search.save();
            } else {
                search.answer = collectionId
                    ? t(
                          'Sorry, an answer could not be found in the collection, try widening your search.',
                          i18n.opts(user)
                      )
                    : t(
                          'Sorry, an answer could not be found in the workspace, try widening your search.',
                          i18n.opts(user)
                      );
            }
        }
        ctx.body = {
            data: {
                policies: presentPolicies(user, documents),
                documents: await Promise.all(
                    documents.map((document) => presentDocument(ctx, document))
                ),
                search: presentSearchQuery(search),
            },
        };
    }
);

router.post(
    'documents.similar',
    auth(),
    rateLimiter(RateLimiterStrategy.TenPerMinute),
    validate(T.DocumentsInfoSchema),
    async (ctx: APIContext<any>) => {
        const { id } = ctx.input.body;
        const { user } = ctx.state.auth;
        let documents: Document[] = [];
        if (!user.team.getPreference(TeamPreference.AIAnswers)) {
            throw ValidationError('Answers are not enabled for this team.');
        }

        if (id) {
            const documentIds = await SearchIndex.getSimilarDocuments(user, id);
            if (documentIds.length) {
                documents = await Document.scope([
                    'withoutState',
                    {
                        method: ['withCollectionPermissions', user.id],
                    },
                ]).findAll({
                    where: {
                        teamId: user.teamId,
                        id: documentIds,
                    },
                    include: [
                        {
                            model: User,
                            as: 'createdBy',
                            paranoid: false,
                        },
                        {
                            model: User,
                            as: 'updatedBy',
                            paranoid: false,
                        },
                    ],
                });
            }
        }

        const policies = presentPolicies(user, documents);
        const data = await Promise.all(
            documents.map((document) => presentDocument(ctx, document))
        );
        ctx.body = {
            pagination: ctx.state.pagination,
            data,
            policies,
        };
    }
);

export default router;
