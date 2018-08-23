import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

/**
 * Base form field class HOC
 */
const formFieldStyles = () => ({
  errorHelpText: {
    fontSize: '1.2em',
    fontWeight: 'bold',
  },
});

export const withFormField = function (WrappedComponent) {
  class withFormFieldClass extends Component {
     onChange = (e) => {
       const value = e.target.value;
       this.props.fieldProps.onChange(e, this.props.name, value);
     }

     render() {
       const { fieldProps, name, defaultValue, helperText, classes, ...rest } = this.props;
       const defaults = {
         value: typeof defaultValue !== 'undefined' ? defaultValue : '',
         error: false,
       };
       const theseFieldProps = { ...defaults, ...fieldProps.fields[name] };
       const { error } = theseFieldProps;

       const helperTextWithError = (
         <span>
           <span className="helpText">{helperText}</span>
           {error
             ? <span className={classes.errorHelpText}><br /><br />{error}</span>
             : null}
         </span>
       );

       delete theseFieldProps.touched;
       delete theseFieldProps.error;

       return (
         <WrappedComponent
           onChange={this.onChange}
           helperText={helperTextWithError}
           error={!!error}
           {...theseFieldProps}
           {...rest}
         />
       );
     }
  }
  withFormFieldClass.propTypes = {
    fieldProps: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    defaultValue: PropTypes.any,
    helperText: PropTypes.node,
    classes: PropTypes.object.isRequired,
  };
  withFormFieldClass.defaultProps = {
    defaultValue: undefined,
    helperText: '',
  };

  return withStyles(formFieldStyles)(withFormFieldClass);
};
