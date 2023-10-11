import csv from 'csv-parser';

function formatCategory(category) {
  return `bahmni-procedures-${category
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/&/g, 'and')}`;
}

export const convertToJSON = (csvFile) => {
  const results = [];
  return new Promise((resolve, reject) => {
    csvFile
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

export function convertToValueSet(data) {
  const bodySiteCategories = [
    ...new Set(data.map((item) => item['Body Site Categories'])),
  ];

  // print all body site categories
  const formattedData = bodySiteCategories
    .map((category) => {
      const valueSet = {
        resourceType: 'ValueSet',
        id: formatCategory(category),
        url: `http://bahmni.org/fhir/ValueSet/${formatCategory(category)}`,
        version: '0.1',
        name: formatCategory(category),
        title: category,
        description: `List of possible procedures on the ${formatCategory(
          category
        )}`,
        status: 'draft',
        experimental: true,
        compose: {
          include: [
            {
              system: 'http://snomed.info/sct',
              concept: data
                .filter((item) => item['Body Site Categories'] === category)
                .map((item) => ({
                  code: item['Target code'],
                }))
                .filter((item) => item.code),
            },
          ],
        },
      };
      return valueSet;
    })
    .filter((item) => item.compose.include[0]?.concept.length > 0);

  return formattedData;
}
