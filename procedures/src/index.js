/* eslint-disable no-console */
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { convertToJSON, convertToValueSet } from './services/formatter';
import {
  saveValueSets,
  saveStatus,
  printStatus,
  syncValueSetsFromTS,
  fetchProcedureConceptsFromBahmni,
  deleteBodySitesInBahmni,
} from './services/createFhirProcedures';
import {
  getProcedureOrdersFromBahmni,
  createSummary,
} from './services/summary';
import delay from './config/delay';
import snowstormAuthHeader from './config/snowstorm-lite-auth';

dotenv.config();

const { SNOWSTORM_VALUESET_URL, BAHMNI_SERVER_URL } = process.env;
const postValueSets = async () => {
  try {
    const outputFiles = fs.readdirSync('output');
    outputFiles.forEach((file) => {
      fs.unlinkSync(`output/${file}`);
    });

    const csvFiles = fs.readdirSync('public');
    const filteredCsvFiles = csvFiles.filter(
      (file) => path.extname(file) === '.tsv'
    );

    const data = [];
    filteredCsvFiles.forEach(file => {
      const fileContent = fs.readFileSync(`public/${file}`, 'utf8')
      const rows = parse(fileContent, { delimiter: '\t', from_line: 2})
      data.push(...rows);
    })
    const valueSets = convertToValueSet(data);

    valueSets.forEach(valueSet => {
        fs.appendFileSync(
          `output/valueSets.ndjson`,
          JSON.stringify(valueSet) + '\n'
        );
    })

    const createdFHIRValueSets = await Promise.all(
       valueSets.map(async (valueSet) => {
            const payload = JSON.stringify(valueSet);
            const request = {
              method: 'post',
              url: SNOWSTORM_VALUESET_URL,
              headers: {
                'Content-Type': 'application/json',
                Authorization: snowstormAuthHeader,
              },
              data: payload,
            };
            await axios(request);
            console.log(`Value set ${valueSet.name} created successfully`);
            return request;
          })
        );

    if (valueSets) {
      const savedValueSets = await saveValueSets(valueSets);

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

  const existingBodySites = await getProcedureOrdersFromBahmni();

  if (isSyncValueSets) {
    await syncValueSetsFromTS();
  } else if (fetchProcedureConcepts) {
    fetchProcedureConceptsFromBahmni();
  } else {
    await deleteBodySitesInBahmni();
    await postValueSets();
  }

  if (!fetchProcedureConcepts) {
    const updatedBodySites = await getProcedureOrdersFromBahmni();
    createSummary(existingBodySites, updatedBodySites);
  }
};

const validateProperties = () => {
  if (!BAHMNI_SERVER_URL) {
    console.error('Value for BAHMNI_SERVER_URL is not provided in .env file');
    process.exit();
  }
  if (!SNOWSTORM_VALUESET_URL) {
    console.error(
      'Value for SNOWSTORM_VALUESET_URL is not provided in .env file'
    );
    process.exit();
  }
};

validateProperties();
start();
