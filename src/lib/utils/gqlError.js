const messages = {
  auth: 'Sorry, you are not authorized to perform this action. Try logging in first and then try again.',
  'invalid-email': 'Sorry, that email address appears to be invalid.',
  unknown: 'Sorry, an error ocurred.',
};

const getType = (msg) => {
  if(/authori/i.test(msg)) return 'auth';
  if(/email is invalid/i.test(msg)) return 'invalid-email';

  return 'unknown';
};

const getBestMessage = (error) => {
  let message = '';

  if(error.graphQLErrors && error.graphQLErrors.length) {
    const e = error.graphQLErrors[0];
    message = e.message;
    if(e.path && e.path.length) {
      message += ` in "${e.path[0]}"`;
    }
  }else if(error.message) {
    message = error.message;
  }else{
    message = 'Unknown';
  }

  return message;
};

const gqlError = (error) => {
  const unfriendlyMessage = getBestMessage(error);
  const type = getType(error);


  const obj = {
    message: messages[type],
    unfriendlyMessage,
    type,
  };

  return obj;
};

export default gqlError;
