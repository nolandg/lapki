import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { withFormFields } from '../HOCs/withFormFields';

/**
 * TextField
 */
const textFieldStyles = {
  blah: {
    fontSize: '1.2em',
    fontWeight: 'bold',
  },
};
const TextFieldUnstyled = ({ value, classes, ...rest }) => {
  if(!value) value = '';
  return <MuiTextField value={value} {...rest} />;
};
TextFieldUnstyled.propTypes = {
  value: PropTypes.any,
  classes: PropTypes.object.isRequired,
};
TextFieldUnstyled.defaultProps = {
  value: '',
};
export const TextField = withStyles(textFieldStyles)(withFormFields(TextFieldUnstyled));
