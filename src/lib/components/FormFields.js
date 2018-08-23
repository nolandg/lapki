import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';
import { withFormField } from '../HOCs/withFormField';

/**
 * TextField
 */
const TextFieldWithoutHOCs = ({ value, ...rest }) => {
  if(!value) value = '';
  return <MuiTextField value={value} {...rest} />;
};
TextFieldWithoutHOCs.propTypes = {
  value: PropTypes.any,
};
TextFieldWithoutHOCs.defaultProps = {
  value: '',
};
export const TextField = withFormField(TextFieldWithoutHOCs);
