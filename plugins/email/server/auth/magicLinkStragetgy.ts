import JWT from 'jsonwebtoken';
import { Strategy } from 'passport-strategy';
import Logger from '@server/logging/Logger';
import RedisAdapter from '@server/storage/redis';

export interface IMagicLinkStrategyOptions {
    secret: string;
    userFields: string[];
    tokenField: string;
    verifyUserAfterToken?: boolean;
    ttl?: number;
}

interface IVerifyUserResult {
    user: any;
    info: any;
}

export class MagicLinkStrategy extends Strategy {
    name = 'magiclink';

    public readonly ttl: number;

    constructor(
        public readonly options: IMagicLinkStrategyOptions,
        public readonly sendToken: (user: any, token: string) => Promise<void>,
        private readonly verifyUser: (user: any) => Promise<IVerifyUserResult>
    ) {
        super();

        // default ttl is 10 minutes
        this.ttl = options.ttl || 60 * 10;
    }

    authenticate(req: any, options: any = {}) {
        const sanitizedOptions = {
            action: 'acceptToken',
            ...options,
        };

        // Request token logic
        // ====================================
        if (sanitizedOptions.action === 'requestToken') {
            return this.requestToken(req, sanitizedOptions);
        }

        // Accept token logic
        if (req.query[this.options.tokenField]) {
            return this.acceptToken(req, sanitizedOptions);
        }

        return this.error(new Error('Unknown action'));
    }

    async requestToken(req: any, _: any) {
        req.body = req.body || {};
        const payload = req.body;
        const token = JWT.sign(
            {
                user: payload,
                iat: Math.floor(Date.now() / 1000),
            },
            this.options.secret,
            {
                expiresIn: this.ttl,
            }
        );

        await this.sendToken(payload, token);
        return this.pass();
    }

    async acceptToken(req: any, _: any) {
        const token = req.query[this.options.tokenField];

        if (!token) {
            return this.fail({ message: 'Token missing' }, 401);
        }

        let payload: any;
        try {
            payload = JWT.verify(token, this.options.secret);
        } catch (err) {
            this.fail({ message: err.message }, 401);
        }

        Logger.info(
            'email',
            `accept token for user:${JSON.stringify(payload)}`
        );

        const { user, info } = await this.verifyUser(payload!.user);

        if (!user) {
            return this.fail({ message: 'User not found' }, 400);
        }

        return this.success(user, info);
    }

    async acceptOTP(req: any, _: any) {
        const { email, code } = req.query;

        if (!email || !code) {
            return this.fail({ message: 'Email or Code missing' }, 401);
        }

        const confirmationCode = await RedisAdapter.defaultClient.get(
            generateOTPKey(email)
        );

        if (confirmationCode !== code) {
            return this.fail({ message: 'Invalid code' }, 401);
        }

        const { user, info } = await this.verifyUser({ email });

        if (!user) {
            return this.fail({ message: 'User not found' }, 400);
        }

        return this.success(user, info);
    }
}

export function generateOTPKey(user: string) {
    return `otp:${user}`;
}
