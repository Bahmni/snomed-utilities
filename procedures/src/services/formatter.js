
function formatCategory(category) {
  return `bahmni-procedures-${category
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/&/g, 'and')}`;
}

export function convertToValueSet(rows) {
  const formattedData = rows
    .map((row) => {
      const category = row[0];
      const ecl = row[1];
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
              filter: [
                {
                  property: "constraint",
                  op: "=",
                  value: ecl
                }
              ]
            }
          ]
        }
      };
      process.stdout.write('format:' + JSON.stringify(valueSet) + '\n');
      return valueSet;
    })

  return formattedData;
}
