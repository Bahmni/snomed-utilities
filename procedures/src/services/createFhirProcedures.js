/* eslint-disable no-console */
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import https from 'https';
import authHeader from '../config/auth';
import delay from '../config/delay';

dotenv.config();

const {
  VALUESET_URL,
  BAHMNI_SERVER_URL,
  BAHMNI_VALUESET_ENDPOINT,
  BAHMNI_CONCEPT_ENDPOINT,
} = process.env;

const agent = BAHMNI_SERVER_URL.includes('localhost')
  ? {
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    }
  : {};

export const saveValueSets = async (valueSets) => {
  try {
    const savedValueSets = await Promise.all(
      valueSets.map(async (value, index) => {
        const config = {
          method: 'POST',
          url: `${BAHMNI_SERVER_URL}${BAHMNI_VALUESET_ENDPOINT}?valueSetId=${value.name}&locale=en&conceptClass=Procedure&conceptDatatype=N/A&contextRoot=Procedure Orders`,
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
      })
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
          `${new Date().toISOString()}: ${value.name}: ${data.status}\n`
        );
        logFile.end();

        return { name: value.name, status: data.status, url: value.url };
      })
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

export const syncValueSetsFromTS = async () => {
  try {
    const config = {
      method: 'GET',
      url: `${BAHMNI_SERVER_URL}${BAHMNI_CONCEPT_ENDPOINT}?q=Procedure Orders&v=custom:(uuid,display,set,name,setMembers:(uuid,name))`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      ...agent,
    };
    const { data } = await axios(config);
    const procedureOrderConceptSet = data?.results?.filter(
      (concept) => concept.display === 'Procedure Orders'
    );
    if (procedureOrderConceptSet.length === 0) {
      console.log('Concept Procedure Orders not found\n');
      return;
    }
    const existingValueSets = procedureOrderConceptSet[0].setMembers.map(
      (setMember) => ({ name: setMember.name.name })
    );
    const savedValueSets = await saveValueSets(existingValueSets);
    const savedStatus = await saveStatus(savedValueSets);
    const printStatuses = await printStatus(savedStatus);
    if (printStatuses) {
      process.stdout.write('Value sets saved successfully\n');
    }
  } catch (err) {
    console.log(err);
  }
};

export const fetchProcedureConceptsFromBahmni = async () => {
  try {
    const config = {
      method: 'GET',
      url: `${BAHMNI_SERVER_URL}${BAHMNI_CONCEPT_ENDPOINT}?q=Procedure Orders&v=custom:(uuid,display,set,name,setMembers:(uuid,name,names,setMembers:(uuid,name,mappings:(display,conceptReferenceTerm))))`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      ...agent,
    };
    const { data } = await axios(config);
    const procedureOrderConceptSet = data?.results?.filter(
      (concept) => concept.display === 'Procedure Orders'
    );
    if (procedureOrderConceptSet.length === 0) {
      console.log('Concept Procedure Orders not found\n');
      return;
    }
    const bodySiteConcepts = procedureOrderConceptSet[0].setMembers;
    const bodySiteConceptsWithProcedures = bodySiteConcepts.map((bodySite) => ({
      bodySite: bodySite.names.filter(
        (name) => name.conceptNameType === 'SHORT'
      )[0].name,
      memberConcepts: bodySite.setMembers.map((concept) => ({
        name: concept.name.name,
        uuid: concept.uuid,
        code: concept.mappings[0].conceptReferenceTerm.code,
      })),
    }));

    const csvRows = [];
    bodySiteConceptsWithProcedures.forEach((bodySite) => {
      bodySite.memberConcepts.forEach((concept) => {
        csvRows.push({
          uuid: concept.uuid,
          name: concept.name,
          code: concept.code,
          bodySite: bodySite.bodySite,
        });
      });
    });
    const CSV_HEADER =
      'Concept UUID,Procedure Name,Target code,Body Site Categories\n';
    const csvData =
      CSV_HEADER +
      csvRows
        .map((row) => `${row.uuid},"${row.name}",${row.code},${row.bodySite}`)
        .join('\n');
    const today = new Date().toISOString();
    const fileName = `procedureConcepts_exported_${today}.csv`;
    fs.writeFileSync(`public/${fileName}`, csvData);
    console.log(`File saved successfully to public/${fileName}`);
  } catch (err) {
    console.log(err);
  }
};

export const deleteValueSetByName = async (valueSetName) => {
  const fullUrl = `${VALUESET_URL}/$expand?url=http://bahmni.org/fhir/ValueSet/${valueSetName}`;
  const tsConfig = {
    method: 'GET',
    url: fullUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    ...agent,
  };
  await delay(1, 1000);
  const { data } = await axios(tsConfig);
  const valueSetId = data?.id;
  const vsDeleteConfig = {
    method: 'DELETE',
    url: `${VALUESET_URL}/${valueSetId}`,
    headers: {
      'Content-Type': 'application/json',
    },
    ...agent,
  };
  await delay(2, 1000);
  await axios(vsDeleteConfig);
};

export const deleteBodySitesInBahmni = async () => {
  try {
    const config = {
      method: 'GET',
      url: `${BAHMNI_SERVER_URL}${BAHMNI_CONCEPT_ENDPOINT}?q=Procedure Orders&v=custom:(uuid,display,set,name,setMembers:(uuid,display))`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      ...agent,
    };
    const { data } = await axios(config);
    const procedureOrderConceptSet = data?.results?.filter(
      (concept) => concept.display === 'Procedure Orders'
    );
    if (procedureOrderConceptSet.length === 0) {
      console.log('Concept Procedure Orders not found\n');
      return;
    }
    const procedureOrderUuid = procedureOrderConceptSet[0].uuid;
    const payloadForSetMembers = JSON.stringify({
      setMembers: [],
    });
    const postConfigForSetMembers = {
      method: 'post',
      url: `${BAHMNI_SERVER_URL}${BAHMNI_CONCEPT_ENDPOINT}/${procedureOrderUuid}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      data: payloadForSetMembers,
    };
    await axios(postConfigForSetMembers);
    await delay(2, 1000);
    const payloadForSet = JSON.stringify({
      set: true,
    });
    const postConfigForSet = {
      method: 'post',
      url: `${BAHMNI_SERVER_URL}${BAHMNI_CONCEPT_ENDPOINT}/${procedureOrderUuid}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      data: payloadForSet,
    };
    await axios(postConfigForSet);
    await delay(3, 1000);
    console.log(
      'Body sites removed successfully from Procedure Orders in Bahmni'
    );

    const bodySiteSetMembers = procedureOrderConceptSet[0].setMembers;
    bodySiteSetMembers.forEach(async (bodySite) => {
      const bodySiteName = bodySite.display;
      deleteValueSetByName(bodySiteName);
    });
  } catch (err) {
    console.log(err);
  }
};
