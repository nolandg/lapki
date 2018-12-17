import gql from 'graphql-tag';
import qatch from 'await-to-js';
import { getApolloClient } from '../../boot/createApolloClient';

const mutation = gql`
  mutation uploadFile($file: Upload!){
    uploadFile(file: $file) {
      id
      location
    }
  }
`;

export default defaultUrl => (file, reportProgress) => new Promise(async (resolve, reject) => {
  const client = getApolloClient();
  const [error, result] = await qatch(client.mutate({
    mutation,
    variables: {
      file,
    },
  }));

  if(error) {
    reject(error);
    return;
  }

  // Noramlzie result
  const normalResult = result.data.uploadFile;
  normalResult.url = normalResult.location;

  resolve(normalResult);
});
