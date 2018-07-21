const queries = [];

const register = (query) => {
  queries.push(query);
};

const runQueries = () => {
  queries.forEach(async (q) => {
    q();
  });
};

const queryManager = {
  register,
  runQueries,
}

export default queryManager
