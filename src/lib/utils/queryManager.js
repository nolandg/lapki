const queries = [];

const registerRefetch = ({ key, refetch, description }) => {
  queries.push({ key, refetch, description });
};

const refetchQueries = (params) => {
  queries.forEach(async (q) => {
    q.refetch(params);
  });
};

const queryManager = {
  registerRefetch,
  refetchQueries,
};

export default queryManager;
