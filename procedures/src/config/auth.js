import dotenv from 'dotenv';

dotenv.config();

const { USERNAME, PASSWORD } = process.env;

const encodedCredentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString(
  'base64',
);

const authHeader = `Basic ${encodedCredentials}`;

export default authHeader;
