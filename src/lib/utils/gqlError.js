const unknownErrorMessage = 'Sorry, an error ocurred.';

const messages = {
  'not-authorized': 'Sorry, you are not authorized to perform this action or view this content. Try logging in first and then try again.',
  'invalid-email': 'Sorry, that email address appears to be invalid.',
  'user-not-found': 'Sorry, we couldn\'t find that user. Check the email and password.',
  'unique-constraint': (type, error) => error.message.replace(
    /.+?unique constraint would be violated on ([a-z]+).*Field name = (.+)/i,
    'It looks like a $1 with that $2 already exists.',
  ),
  unknown: unknownErrorMessage,
};

const getType = (error) => {
  const msg = error.message;

  if(/authori/i.test(msg)) return 'not-authorized';
  if(/email is invalid/i.test(msg)) return 'invalid-email';
  if(/no user found/i.test(msg)) return 'user-not-found';
  if(/unique constraint would be violated on/i.test(msg)) return 'unique-constraint';
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
  let message;

  switch (typeof messages[type]) {
    case 'string': message = messages[type]; break;
    case 'function': message = messages[type](type, error); break;
    default: message = unknownErrorMessage;
  }

  const obj = {
    message,
    unfriendlyMessage,
    type,
  };

  return obj;
};

export default gqlError;
