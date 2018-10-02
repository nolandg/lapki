import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';

import { withFormFields } from '../HOCs/withFormFields';

export { Select } from './Select';
export { DatePicker } from './DatePicker';
export { YearMonthDayPicker } from './YearMonthDayPicker';

/**
 * TextField
 */
const TextField = ({ value, onChange, ...rest }) => {
  if(!value) value = '';
  return <MuiTextField value={value} onChange={event => onChange(event.target.value)} {...rest} />;
};
TextField.propTypes = {
  value: PropTypes.any,
};
TextField.defaultProps = {
  value: '',
};
const EnhancedTextField = withFormFields(TextField);
export { EnhancedTextField as TextField };
