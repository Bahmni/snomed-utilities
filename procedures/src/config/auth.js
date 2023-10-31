import dotenv from 'dotenv';

dotenv.config();

const { BAHMNI_USERNAME, BAHMNI_PASSWORD } = process.env;

const encodedCredentials = Buffer.from(
  `${BAHMNI_USERNAME}:${BAHMNI_PASSWORD}`
).toString('base64');

const authHeader = `Basic ${encodedCredentials}`;

export default authHeader;
