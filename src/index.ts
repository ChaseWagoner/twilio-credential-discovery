import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import * as Twilio from 'twilio';

interface Credentials {
  accountSid: string;
  authToken: string;
}

interface ClientOptions {
  credentials?: Credentials;
  options?: Twilio.Twilio.TwilioClientOptions;
}

interface CredsFile {
  projects: Array<{
    id: string;
    accountSid: string;
    authToken: string;
  }>;
}

class TwilioCredentialDiscovery {
  constructor(private readonly logger?: winston.Logger) {
    if (!logger) {
      this.logger = winston.createLogger({
        transports: [
          new winston.transports.Console({
            level: 'debug',
          }),
        ],
      });
    }
  }

  public getTwilioClient(opts?: ClientOptions) {
    let credentials: Credentials;

    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_PROJECT_ID,
    } = process.env;

    const credsFilePath = path.join(process.env.HOME, '.credentials/twilio.json');

    if (opts?.credentials) {
      this.logger.debug('Trying opts.credentials');
      const { accountSid, authToken } = opts.credentials;

      if (!(accountSid && authToken)) {
        const err = `'options.credentials' is missing 'accountSid' and/or 'authToken'`;
        this.logger.error(err);
        throw new Error(err);
      }

      credentials = {
        accountSid: opts.credentials.accountSid,
        authToken: opts.credentials.authToken,
      };
    } else if ([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN].filter(val => Boolean(val)).length) {
      this.logger.debug('Trying process.env');
      if (!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN)) {
        const err = `One environment variable is missing: 'TWILIO_ACCOUNT_SID' or 'TWILIO_AUTH_TOKEN'`;
        this.logger.error(err);
        throw new Error(err);
      }

      credentials = {
        accountSid: TWILIO_ACCOUNT_SID,
        authToken: TWILIO_AUTH_TOKEN,
      };
    } else if (TWILIO_PROJECT_ID &&  fs.existsSync(credsFilePath)) {
      this.logger.debug('Trying project ID + credentials file');
      const content = fs.readFileSync(credsFilePath, 'utf-8');

      let credsFile: CredsFile;

      try {
        credsFile = JSON.parse(content);
      } catch (e) {
        const err = `Failed to parse JSON from '${credsFilePath}'`;
        this.logger.error(`${err}: ${e.message}`);
        throw new Error(err);
      }

      if (!credsFile.projects) {
        const err = `Credentials file '${credsFilePath}' missing '.projects'`;
        this.logger.error(err);
        throw new Error(err);
      }

      if (!Array.isArray(credsFile.projects)) {
        const err = `Credentials file '${credsFilePath}' property 'projects' must be an array`;
        this.logger.error(err);
        throw new Error(err);
      }

      credsFile.projects.find(project => {
        if (project.id === TWILIO_PROJECT_ID) {
          if (!(project.accountSid && project.authToken)) {
            const err = `Credentials file '${credsFilePath}' contains project '${TWILIO_PROJECT_ID}', but is missing 'accountSid' and/or 'authToken'`;
            this.logger.error(err);
            throw new Error(err);
          }

          credentials = {
            accountSid: project.accountSid,
            authToken: project.authToken,
          };

          return true;
        }
      });

      if (!credentials) {
        this.logger.warn(`Credentials file has no project with ID '${TWILIO_PROJECT_ID}'`);
      }
    }

    if (!credentials) {
      this.logger.warn(`Instantiating with no arguments; will likely fail since environment variables were already checked`);
      return Twilio();
    }

    return Twilio(credentials.accountSid, credentials.authToken, opts?.options);
  }
}

export default TwilioCredentialDiscovery;