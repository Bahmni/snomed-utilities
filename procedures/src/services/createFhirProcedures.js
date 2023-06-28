/* eslint-disable no-console */
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import https from 'https';
import authHeader from '../config/auth';
import delay from '../config/delay';

dotenv.config();

const { BAHMNI_SERVER_URL } = process.env;

const agent = BAHMNI_SERVER_URL.includes('localhost') ? {} : {
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
};

export const saveValueSets = async (valueSets) => {
  try {
    const savedValueSets = await Promise.all(
      valueSets.map(async (value, index) => {
        const config = {
          method: 'POST',
          url: `${BAHMNI_SERVER_URL}?valueSetId=${value.name}&locale=en&conceptClass=Procedure&conceptDatatype=N/A&contextRoot=Procedure Orders`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          ...agent,
        };

        await delay(index, 200);

        const { data } = await axios(config);
        console.log({ name: value.name, url: data });
        return { name: value.name, url: data };
      }),
    );
    return savedValueSets;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const saveStatus = async (valueSets) => {
  try {
    const logsPath = path.join(__dirname, '../../logs/logs.txt');
    if (fs.existsSync(logsPath)) {
      fs.unlinkSync(logsPath);
    }
    const savedStatus = await Promise.all(
      valueSets.map(async (value) => {
        const config = {
          method: 'GET',
          url: value.url.replace('http:', 'https:'),
          headers: {
            Accept: '*/*',
            Authorization: authHeader,
          },
          ...agent,
        };
        const { data } = await axios.request(config);

        const logFile = fs.createWriteStream(logsPath, { flags: 'a' });
        logFile.write(
          `${new Date().toISOString()}: ${value.name}: ${data.status}\n`,
        );
        logFile.end();

        return { name: value.name, status: data.status, url: value.url };
      }),
    );
    return savedStatus;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const printStatus = async (statuses) => {
  const status = [...new Set(statuses.map((s) => s.status))];

  status.forEach((item) => {
    const count = statuses.filter((s) => s.status === item).length;
    console.log(`${item}: ${count} \n`);
  });
};
