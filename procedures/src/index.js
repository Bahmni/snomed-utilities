/* eslint-disable no-console */
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { convertToJSON, convertToValueSet } from './services/formatter';
import {
  saveValueSets,
  saveStatus,
  printStatus,
  syncValueSetsFromTS,
  fetchProcedureConceptsFromBahmni,
  deleteBodySitesInBahmni,
} from './services/createFhirProcedures';
import delay from './config/delay';
import snowstormAuthHeader from './config/snowstorm-lite-auth';

dotenv.config();

const { VALUESET_URL, BAHMNI_SERVER_URL } = process.env;
const postValueSets = async () => {
  try {
    const outputFiles = fs.readdirSync('output');
    outputFiles.forEach((file) => {
      fs.unlinkSync(`output/${file}`);
    });

    const csvFiles = fs.readdirSync('public');
    const filteredCsvFiles = csvFiles.filter(
      (file) => path.extname(file) === '.csv'
    );

    if (filteredCsvFiles.length === 0) return;

    const valuesets = await Promise.all(
      filteredCsvFiles
        .map(async (file) => {
          const csvFile = fs.createReadStream(`public/${file}`);
          const data = await convertToJSON(csvFile);
          const valueSet = convertToValueSet(data);
          await fs.writeFileSync(
            `output/${file.replace('.csv', '.json')}`,
            JSON.stringify(valueSet)
          );
          return valueSet;
        })
        .flat()
    );

    const createValueSets = await Promise.all(
      valuesets.map(async (valueSet) =>
        Promise.all(
          valueSet.map(async (value, index) => {
            const payload = JSON.stringify(value);
            const config = {
              method: 'post',
              url: VALUESET_URL,
              headers: {
                'Content-Type': 'application/json',
                Authorization: snowstormAuthHeader,
              },
              data: payload,
            };
            await delay(index + 1, 1000);
            await axios(config);
            return value;
          })
        )
      )
    );

    if (createValueSets) {
      const savedValueSets = await saveValueSets(createValueSets.flat());

      const savedStatus = await saveStatus(savedValueSets);

      const printStatuses = await printStatus(savedStatus);

      if (printStatuses) {
        process.stdout.write('Value sets saved successfully\n');
      }
    }
  } catch (err) {
    console.log(err);
  }
};

const start = async () => {
  const isSyncValueSets = process.argv.includes('sync');
  const fetchProcedureConcepts = process.argv.includes('fetch');
  if (isSyncValueSets) {
    syncValueSetsFromTS();
  } else if (fetchProcedureConcepts) {
    fetchProcedureConceptsFromBahmni();
  } else {
    await deleteBodySitesInBahmni();
    postValueSets();
  }
};

const validateProperties = () => {
  if (!BAHMNI_SERVER_URL) {
    console.error('Value for BAHMNI_SERVER_URL is not provided in .env file');
    process.exit();
  }
  if (!VALUESET_URL) {
    console.error('Value for VALUESET_URL is not provided in .env file');
    process.exit();
  }
};

validateProperties();
start();
