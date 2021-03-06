import gql from 'graphql-tag';
// import pluralize from 'pluralize';
import { camelToPascal } from './stringUtils';

export default (operation, collection, fragmentName) => {
  const pascalType = camelToPascal(collection.type);
  const pascalOperation = camelToPascal(operation);

  const data = operation !== 'delete'
    ? `$data: ${pascalType}${pascalOperation}Input!`
    : '';
  const where = operation !== 'create'
    ? `$where: ${pascalType}WhereUniqueInput!`
    : '';

  let fragment = collection.fragments[fragmentName];
  let fragmentDefinitionName = fragment.definitions[0].name.value;

  if(operation === 'delete') {
    fragmentDefinitionName = `Delete${pascalType}AutoBuiltFragment`;
    fragment = gql`
      fragment ${fragmentDefinitionName} on ${pascalType}{
        id
      }
    `;
  }

  const mutation = gql`
    ${fragment}

    mutation ${operation}${pascalType}(
      ${data}
      ${where}
    ){
      ${operation}${pascalType}(${data ? 'data: $data' : ''}, ${where ? 'where: $where' : ''}) {
        ...${fragmentDefinitionName}
      },
    }
  `;

  return mutation;
};
