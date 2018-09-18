import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';

import { withFormFields } from '../HOCs/withFormFields';

/**
 * Select
 */
export { Select } from './Select';


/**
 * TextField
 */
const TextField = ({ value, ...rest }) => {
  if(!value) value = '';
  return <MuiTextField value={value} {...rest} />;
};
TextField.propTypes = {
  value: PropTypes.any,
};
TextField.defaultProps = {
  value: '',
};
const EnhancedTextField = withFormFields(TextField);
export { EnhancedTextField as TextField };
