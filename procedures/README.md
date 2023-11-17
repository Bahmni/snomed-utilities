# Procedures Utility

This repository contains the utility code for adding value sets to the snowstorm server and to Bahmni procedures. More details can be found in [this](https://bahmni.atlassian.net/wiki/spaces/BAH/pages/3132686337/SNOMED+FHIR+Terminology+Server+Integration+with+Bahmni) Wiki link

# Run

1. This utility requires Node, npm.

### One time installation:

These steps need to performed ONLY the FIRST TIME you set up this code.

1. Install node/npm (node version: 10.11.0). Preferably use nvm, so that you have control over which project uses which version of node. See:

   - [how to install Node using nvm](https://github.com/nvm-sh/nvm).
   - [how to install NodeJS on mac](https://www.newline.co/@Adele/how-to-install-nodejs-and-npm-on-macos--22782681)

### Environment Variables

| Variable                | Description                                                 | Example                                                                                                                                |
| ----------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| SNOWSTORM_VALUESET_URL  | Snowstorm server value set url                              | https://snowstorm.snomed.mybahmni.in/fhir/ValueSet Use http://localhost:9191/fhir/ValueSet for SNOWSTORM-LITE in the local environment |
| SNOWSTORM_LITE_USERNAME | Snowstorm server username (required if SNOWSTORM LITE used) | admin                                                                                                                                  |
| SNOWSTORM_LITE_PASSWORD | Snowstorm server password (required if SNOWSTORM LITE used) | Admin123                                                                                                                               |
| BAHMNI_SERVER_URL       | Bahmni Server URL                                           | https://{bahmni.instance.com}                                                                                                          |
| BAHMNI_USERNAME         | Bahmni username                                             | superman                                                                                                                               |
| BAHMNI_PASSWORD         | Bahmi password                                              | Admin123                                                                                                                               |

### Inputs

Disclaimer: This repository includes sample reference procedure orders in public/procedures.csv. Users of this utility are solely responsible for uploading procedures according to their specific requirements.

1. copy your procedures csv file into the `public` directory. The csv file **MUST** have the following fields:

| Target code                                     | Body Site Categories  |
| ----------------------------------------------- | --------------------- |
| snomed code for the procedure e.g. (1119420003) | Body site e.g. (Head) |

### Commands

Run these commands from within the root folder.

1. `npm install`
2. `npm start`

This utility supports multiple options.

- To Sync already loaded procedures in Bahmni with the Valuesets in the terminology server, run the command `npm start sync`
- To fetch loaded procedures in Bahmni, run the command `npm start fetch`. CSV file generated in the directory `public/procedureConcepts_exported_timestamp.csv`
- To override the procedure orders in openMRS and Snowstorm sever with the CSV configuration, run the command `npm start replace`. This is the default option. It uses the CSV file in the directory `public/`

This utility provides the summary of procedures and body sites in the form of tree. (Pre and post changes in Bahmni Procedure Orders)

```
Summary
├─ Fluoroscopy (Deleted)
│  └─ Spinal cordotomy (Deleted)
├─ Abdomen (Deleted)
│  └─ Excision of excessive skin and subcutaneous tissue of abdomen (Deleted)
├─ Head and Neck
│  ├─ Lipid-lowering therapy
│  └─ Radical dissection of left half of neck
├─ Ear (Added)
│  └─ Excision of external ear, complete amputation (Added)
└─ Nose (Updated)
   ├─ Removal of abdominal pack (Updated)
   ├─ Excision of external ear, complete amputation
   └─ Destruction of lesion of internal nose by external approach
```
