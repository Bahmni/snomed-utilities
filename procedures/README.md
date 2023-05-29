# Procedures Utility

This repository contains the utility code for adding value sets to the snowstorm server and to Bahmni procedures.

# Run

1. This utility requires Node, npm.

### One time installation:

These steps need to performed ONLY the FIRST TIME you set up this code.

1. Install node/npm (node version: 10.11.0). Preferably use nvm, so that you have control over which project uses which version of node. See:

   * [how to install Node using nvm](https://github.com/nvm-sh/nvm).
   * [how to install NodeJS on mac](https://www.newline.co/@Adele/how-to-install-nodejs-and-npm-on-macos--22782681)

### Environment Variables

| Variable          | Description                     | Example                                                                       |
| ----------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| SAVE_VALUESET_URL | Snowstorm server value set url | https://snowstorm.snomed.mybahmni.in/fhir/ValueSet                            |
| BAHMNI_SERVER_URL | Bahmni procedures endpoint      | https://{bahmni.instance.com}/openmrs/ws/rest/v1/terminologyServices/valueSet |
| USERNAME          | Bahmni username                 | superman                                                                      |
| PASSWORD          | Bahmi password                  | Admin123                                                                      |

### Inputs

1. copy your procedures csv file into the `public` directory. The csv file **MUST** have the following fields:

| Target code                                     | Body Site Categories   |
| ----------------------------------------------- | ---------------------- |
| snomed code for the procedure e.g. (1119420003) | Body site e.g. (Head) |

### Commands

Run these commands from within the root folder.

1. `npm install`
2. `npm start`
