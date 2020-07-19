# twilio-credential-discovery

A wrapper for the [Twilio Node.js SDK][twilio-package], designed to make working with Twilio project credentials easier.

Credential discovery and selection is inspired by the AWS Node.js SDK.

### Status

N.B.: this is very much untested; use it as a (hopefully) handy tool, not a production-ready dependency.

### References

See also: [Setting Credentials in Node.js][aws] ([archive][aws-archive] at time of writing).

[aws]: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html
[aws-archive]: http://web.archive.org/web/20200718221527/https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html
[twilio-package]: https://www.npmjs.com/package/twilio
[twilio-source]: https://github.com/twilio/twilio-node

## Credential Selection

If more than one credential source is available to the SDK, the default precedence of selection is as follows:

1. Credentials that are explicitly set through the constructor.

1. Environment variables (the same used by the underlying Twilio SDK package).
    - `TWILIO_ACCOUNT_SID`
    - `TWILIO_AUTH_TOKEN`

1. The shared credentials file.
    - Path: `${HOME}/.credentials/twilio.json` (using `process.env.HOME`)
    - Format:
        ```js
        {
          "projects": [
            {
              // Choose a unique and memorable identifier for each project
              "id": "my-project",
              // From the Twilio console
              "accountSid": "AC*****",
              // From the Twilio console
              "authToken": "*****"
            }
          ]
        }
        ```
    - Project selection: the `projects` array is searched for an object where the `id` property matches environment variable `TWILIO_PROJECT_ID`.

    Notes:
    - This has no effect if
        - the environment variable is undefined or empty
        - the file does not exist
        - the file exists but contains no project object with an `id` that matches the environment variable.
    - It is possible for multiple projects to have identical `id` values. In such a case, this method uses the _first_ object satisfying the above comparison.

If no credential discovery method succeeds, all arguments are passed through to the Twilio client constructor as-is.

## Notes

This package attempts to ensure merely the presence of Twilio credentials, _not_ the validity of any selected credentials.

The underlying Twilio SDK will check validity of certain things at time of instantiation; otherwise, validity should be determined simply by making Twilio API requests.
