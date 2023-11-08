/* eslint-disable no-console */
import axios from 'axios';
import dotenv from 'dotenv';
import https from 'https';
import _ from 'lodash';
import treeify from 'treeify';

import authHeader from '../config/auth';

dotenv.config();

const { BAHMNI_SERVER_URL, BAHMNI_CONCEPT_ENDPOINT } = process.env;

const agent = BAHMNI_SERVER_URL.includes('localhost')
  ? {
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    }
  : {};

export const getProcedureOrdersFromBahmni = async () => {
  try {
    const config = {
      method: 'GET',
      url: `${BAHMNI_SERVER_URL}${BAHMNI_CONCEPT_ENDPOINT}?q=Procedure Orders&v=custom:(uuid,display,set,name,setMembers:(uuid,names:(uuid,name,conceptNameType),setMembers:(uuid,names:(uuid,name,conceptNameType))))`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      ...agent,
    };
    const { data } = await axios(config);
    return data?.results[0]?.setMembers || [];
  } catch (err) {
    console.log(err);
  }
};

const addPropertyToNestedObject = (obj, propName, propValue) => {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }
  Object.entries(obj).forEach(([_, value]) => {
    if (typeof value === 'object' && !Array.isArray(value)) {
      addPropertyToNestedObject(value, propName, propValue);
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === 'object') {
          addPropertyToNestedObject(item, propName, propValue);
        }
      });
    } else {
      Object.defineProperty(obj, propName, {
        value: propValue,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  });
};

const createSummaryTree = (combinedBodySites) => {
  const tree = {};
  for (let i = 0; i < combinedBodySites.length; i += 1) {
    const bodySite = combinedBodySites[i];
    const bodySiteName =
      bodySite.names.filter((name) => name.conceptNameType === 'SHORT')[0]
        .name || bodySite.names[0].name;
    let bodySiteStatus = '';
    if (bodySite.existing && bodySite.updated) {
      bodySiteStatus = '';
    } else if (bodySite.existing) {
      bodySiteStatus = 'Deleted';
    } else {
      bodySiteStatus = 'Added';
    }
    const treeMembers = {};
    let deletedCount = 0;
    let addedCount = 0;
    for (let index = 0; index < bodySite.setMembers.length; index++) {
      const procedure = bodySite.setMembers[index];
      let nameElement = procedure.names?.filter(
        (name) => name?.conceptNameType && name?.conceptNameType === 'SHORT'
      )[0];
      if (!nameElement) {
        nameElement = procedure.names?.filter(
          (name) =>
            name?.conceptNameType && name?.conceptNameType === 'FULLY_SPECIFIED'
        )[0];
      }
      const procedureName = nameElement?.name;
      const procedureStatus =
        nameElement.existing && nameElement.updated
          ? ''
          : nameElement.existing
          ? 'Deleted'
          : 'Added';
      if (procedureStatus === 'Deleted') {
        deletedCount += 1;
      } else if (procedureStatus === 'Added') {
        addedCount += 1;
      }
      const memberNode = procedureStatus
        ? `${procedureName} (${procedureStatus})`
        : procedureName;
      treeMembers[memberNode] = null;
    }

    if (addedCount === bodySite.setMembers.length) {
      bodySiteStatus = 'Added';
    } else if (deletedCount === bodySite.setMembers.length) {
      bodySiteStatus = 'Deleted';
    } else if (addedCount > 0 || deletedCount > 0) {
      bodySiteStatus = 'Updated';
    }
    const bodySiteWithStatus = bodySiteStatus
      ? `${bodySiteName} (${bodySiteStatus})`
      : bodySiteName;
    tree[`${bodySiteWithStatus}`] = treeMembers;
  }
  console.log('Summary');
  console.log(treeify.asTree(tree, true));
};

export const createSummary = (existingBodySites, updatedBodySites) => {
  addPropertyToNestedObject(existingBodySites, 'existing', true);
  addPropertyToNestedObject(updatedBodySites, 'updated', true);

  const combinedBodySites = _.cloneDeep(existingBodySites);

  updatedBodySites.forEach((updatedBodySite) => {
    const existingBodySite = combinedBodySites.find(
      (bodySite) => bodySite.uuid === updatedBodySite.uuid
    );
    if (existingBodySite) {
      const existingBodySiteProcedures = existingBodySite.setMembers;
      const updatedBodySiteProcedures = updatedBodySite.setMembers;

      const combinedProcedures = existingBodySiteProcedures
        .map((setMember1) => {
          const setMember2 = updatedBodySiteProcedures.find(
            (setMember) => setMember.uuid === setMember1.uuid
          );
          if (setMember2) {
            return { ...setMember1, ...setMember2 };
          }
          return { ...setMember1 };
        })
        .concat(
          updatedBodySiteProcedures.filter(
            (item2) =>
              !existingBodySiteProcedures.some(
                (item1) => item1.uuid === item2.uuid
              )
          )
        );
      combinedProcedures.forEach((procedureOrder) => {
        const names = procedureOrder.names.map((name) => {
          const existingSetMemberProcedureOrder =
            existingBodySite.setMembers.find(
              (existingProcedureOrder) =>
                existingProcedureOrder.uuid === procedureOrder.uuid
            );
          if (existingSetMemberProcedureOrder) {
            const existingProcedureName =
              existingSetMemberProcedureOrder.names.find(
                (exitingProcedureName) =>
                  exitingProcedureName.uuid === name.uuid
              );
            if (existingProcedureName) {
              return { ...name, existing: true };
            }
            return { ...name, existing: false };
          }
          return name;
        });
        procedureOrder.names = names;
      });
      existingBodySite.setMembers = _.cloneDeep(combinedProcedures);

      const existingBodySiteNames = existingBodySite.names;
      const updatedBodySiteNames = updatedBodySite.names;
      const combinedNames = existingBodySiteNames
        .map((name1) => {
          const name2 = updatedBodySiteNames.find(
            (name) => name.uuid === name1.uuid
          );
          if (name2) {
            return { ...name1, ...name2 };
          }
          return { ...name1 };
        })
        .concat(
          updatedBodySiteNames.filter(
            (item2) =>
              !existingBodySiteNames.some((item1) => item1.uuid === item2.uuid)
          )
        );
      existingBodySite.names = _.cloneDeep(combinedNames);
      existingBodySite.updated = true;
    } else {
      combinedBodySites.push(updatedBodySite);
    }
  });
  createSummaryTree(combinedBodySites);
};
