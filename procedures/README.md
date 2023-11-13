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

| Variable               | Description                                                 | Example                                            |
| ---------------------- |-------------------------------------------------------------|----------------------------------------------------|
| SNOWSTORM_VALUESET_URL | Snowstorm server value set url                              | https://snowstorm.snomed.mybahmni.in/fhir/ValueSet |
| SNOWSTORM_LITE_USERNAME | Snowstorm server username (required if SNOWSTORM LITE used) | admin                                              |
| SNOWSTORM_LITE_PASSWORD | Snowstorm server password (required if SNOWSTORM LITE used) | Admin123                                           |
| BAHMNI_SERVER_URL      | Bahmni Server URL                                           | https://{bahmni.instance.com}                      |
| BAHMNI_USERNAME        | Bahmni username                                             | superman                                           |
| BAHMNI_PASSWORD        | Bahmi password                                              | Admin123                                           |

### Inputs

Disclaimer: Bahmni doesn't ship with any curated content of procedures. It is individual's responsibility that is making use of this utility to upload procedures based on their requirements.

1. copy your procedures csv file into the `public` directory. The tab separated csv file **MUST** have the following fields:

| Body Site Category                   | SNOMED ECL Query                                                                                                                                                   |
|--------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Body site (for example: Head & Neck) | Query (for example: ^816080008 \|International Patient Summary\| : << 363704007 \|Procedure site\| = << 774007 \|Structure of head and/or neck (body structure)\|) |

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

