import React, { Component, Fragment } from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import ErrorIcon from '@material-ui/icons/Error';

/**
 * Base form field class HOC
 */
const formFieldStyles = theme => ({
  errorMessage: {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'white',
    backgroundColor: theme.palette.error.main,
    padding: theme.spacing.unit,
    paddingRight: theme.spacing.unit * 2,
    borderRadius: '3px',
    marginTop: theme.spacing.unit,
    fontSize: '1.2em',
  },
  errorIcon: {
    marginRight: theme.spacing.unit,
  },
});

export const withFormFields = function (WrappedComponent) {
  class withFormFieldsClass extends Component {
     onChange = (value) => {
       this.props.fieldProps.onChange(this.props.name, value);
     }

     render() {
       const { fieldProps, name, defaultValue, helperText, classes, ...rest } = this.props;
       const defaults = {
         value: typeof defaultValue !== 'undefined' ? defaultValue : '',
         error: false,
       };
       const { loading, disabled } = fieldProps;
       const theseFieldProps = { ...defaults, ...fieldProps.fields[name] };
       const { error } = theseFieldProps;

       let helperTextWithError = helperText;

       if(error) {
         helperTextWithError = (
           <Fragment>
             {helperText}
             {helperText ? <br /> : null}
             <span className={classes.errorMessage}>
               <ErrorIcon className={classes.errorIcon} />
               {error}
             </span>
           </Fragment>
         );
       }

       delete theseFieldProps.touched;
       delete theseFieldProps.error;

       return (
         <WrappedComponent
           onChange={this.onChange}
           helperText={helperTextWithError}
           error={!!error}
           disabled={disabled || loading}
           {...theseFieldProps}
           {...rest}
         />
       );
     }
  }
  withFormFieldsClass.propTypes = {
    fieldProps: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    defaultValue: PropTypes.any,
    helperText: PropTypes.node,
    classes: PropTypes.object.isRequired,
  };
  withFormFieldsClass.defaultProps = {
    defaultValue: undefined,
    helperText: '',
  };

  return withStyles(formFieldStyles)(withFormFieldsClass);
};
