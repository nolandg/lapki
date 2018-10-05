import React, { Component } from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { TextField, Mutator } from '../components'; // eslint-disable-line import/no-extraneous-dependencies

import RequestPasswordResetCollection from '../collections/RequestPasswordReset';

const styles = theme => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    margin: {
      top: theme.spacing.unit * 1,
    },
  },
});

const requestPasswordResetQuery = gql`
  mutation RequestPasswordResetQuery($email: String!) {
    triggerPasswordReset(email: $email){
      ok
    }
  }
`;

class RequestPasswordResetForm extends Component {
  constructor(props) {
    super(props);
    this.operations = this.buildOperations(props);
  }

  buildOperations = props => ({
    requestPasswordReset: {
      mutationQuery: requestPasswordResetQuery,
      renderButton: this.renderButton,
      handleClick: this.handleClick,
    },
  })

  renderButton = ({ handleClick, loading, result }) => (
    <Button onClick={handleClick} variant="contained" color="primary" disabled={loading}>
      Reset Password
    </Button>
  )

  handleClick = async (mutate, { prepareToSaveDoc }, result) => {
    const requestDetails = await prepareToSaveDoc();
    if(!requestDetails) return; // must have failed validation
    mutate({
      variables: { ...requestDetails },
    });
  }

  handleSuccess = ({ login }) => {
    const{ onSuccess } = this.props;
    if(onSuccess) onSuccess();
  }

  getSuccessMessageAndAction = ({ data }) => {
    console.log(data);
    return { message: 'Check your email!' };
  }

  renderForm = ({ fieldProps, mutationComponents, globalErrors, errors }) => {
    const { requestPasswordReset } = mutationComponents;
    const { classes } = this.props;
    return(
      <div className={classes.form}>
        <TextField name="email" label="Email" margin="normal" fieldProps={fieldProps} />
        <div className={classes.buttons}>
          {requestPasswordReset}
        </div>
      </div>
    );
  }

  render() {
    const { classes, ...rest } = this.props;

    return (
      <Mutator
        collection={RequestPasswordResetCollection}
        fields={['email']}
        children={this.renderForm}
        operations={this.operations}
        onMutationSuccess={this.handleSuccess}
        defaultValues={{ email: 'noland@advancedwebapps.ca' }}
        getSuccessMessageAndAction={this.getSuccessMessageAndAction}
        {...rest}
      />
    );
  }
}

RequestPasswordResetForm.propTypes = {
  onSuccess: PropTypes.func,
  classes: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
};
RequestPasswordResetForm.defaultProps = {
  currentUser: null,
  onSuccess: null,
};

RequestPasswordResetForm = withStyles(styles)(RequestPasswordResetForm);
export { RequestPasswordResetForm };
