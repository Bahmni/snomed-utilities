import dotenv from 'dotenv';

dotenv.config();

const { SNOWSTORM_LITE_USERNAME, SNOWSTORM_LITE_PASSWORD } = process.env;

const encodedCredentials = Buffer.from(
  `${SNOWSTORM_LITE_USERNAME}:${SNOWSTORM_LITE_PASSWORD}`
).toString('base64');

const snowstormAuthHeader = `Basic ${encodedCredentials}`;

export default snowstormAuthHeader;
