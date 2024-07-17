import emails from '@server/emails/templates';
import BaseTask from './BaseTask';
import Logger from '@server/logging/Logger';

type Props = {
    templateName: string;
    props: Record<string, any>;
};

export default class EmailTask extends BaseTask<Props> {
    public async perform({ templateName, props, ...metadata }: Props) {
        const EmailClass = emails[templateName];
        if (!EmailClass) {
            Logger.info(
                'email',
                `Avaiable email template: ${Object.keys(emails).join(', ')}`
            );
            throw new Error(
                `Email task "${templateName}" template does not exist. Check the file name matches the class name.`
            );
        }

        const email = new EmailClass(props, metadata);
        return email.send();
    }
}
