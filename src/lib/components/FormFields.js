import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';

import { withFormFields } from '../HOCs/withFormFields';

export { Select } from './Select';
export { DatePicker } from './DatePicker';
export { YearMonthDayPicker } from './YearMonthDayPicker';
export { FileUploader } from './FileUploader';

/**
 * Masked Text Field
 */
const onChangeCleanInput = ({ onChange, blacklist }) => (event) => {
  let value = event.target.value;
  value = value.replace(blacklist, '');
  onChange(value);
};
const MaskedTextField = ({ value, onChange, blacklist, ...rest }) => {
  if(!value) value = '';
  return <MuiTextField value={value} onChange={onChangeCleanInput({ onChange, blacklist })} {...rest} />;
};
MaskedTextField.propTypes = {
  value: PropTypes.any,
  blacklist: PropTypes.instanceOf(RegExp).isRequired,
};
MaskedTextField.defaultProps = {
  value: '',
};
const EnhancedMaskedTextField = withFormFields(MaskedTextField);
export { EnhancedMaskedTextField as MaskedTextField };

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
