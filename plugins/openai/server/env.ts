import { IsOptional } from 'class-validator';
import { Environment } from '@server/env';
import { Public } from '@server/utils/decorators/Public';
import environment from '@server/utils/environment';
import { CannotUseWithout } from '@server/utils/validators';

class OpenAIPluginEnvironment extends Environment {
    /**
     * OpenAI client credentials. To enable authentication with OpenAI.
     */
    @IsOptional()
    public OPENAI_API_KEY = this.toOptionalString(environment.OPENAI_API_KEY);

    /**
     * OpenAI client credentials. To enable authentication with OpenAI.
     */
    @IsOptional()
    @CannotUseWithout('OPENAI_API_KEY')
    public OPENAI_URL = this.toOptionalString(environment.OPENAI_URL);

    /**
     * OpenAI client credentials. To enable authentication with OpenAI.
     */
    @Public
    public VSS_ENABLED = !!this.OPENAI_API_KEY;
}

export default new OpenAIPluginEnvironment();
