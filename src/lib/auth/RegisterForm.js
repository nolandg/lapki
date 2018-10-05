import React, { Component } from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { TextField, Mutator } from '../components'; // eslint-disable-line import/no-extraneous-dependencies

import RegisterCollection from '../collections/Register';

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

const registerQuery = gql`
  mutation Login($data: SignupInput!) {
    signup(data: $data){
      id
    }
  }
`;

class RegisterForm extends Component {
  constructor(props) {
    super(props);
    this.operations = this.buildOperations(props);
  }

  buildOperations = props => ({
    register: {
      mutationQuery: registerQuery,
      renderButton: this.renderRegisterButton,
      handleClick: this.handleRegisterClick,
    },
  })

  renderRegisterButton = ({ handleClick, loading, result }) => (
    <Button onClick={handleClick} variant="contained" color="primary" disabled={loading}>
      Register
    </Button>
  )

  handleRegisterClick = async (mutate, { prepareToSaveDoc }, result) => {
    const formValues = await prepareToSaveDoc();
    if(!formValues) return; // must have failed validation

    delete formValues.passwordConfirm;

    mutate({
      variables: { data: { ...formValues } },
    });
  }

  handleSuccess = ({ login }) => {
    const{ onSuccess } = this.props;
    if(onSuccess) onSuccess();
  }

  getSuccessMessageAndAction = ({ data, hackToGetDoc }) => ({ message: (
    <span>
        You are now logged in as <em>{hackToGetDoc.email}</em>
    </span>
  ) })

  renderForm = ({ fieldProps, mutationComponents, globalErrors, errors }) => {
    const { register } = mutationComponents;
    const { classes } = this.props;
    return(
      <div className={classes.form}>
        <TextField name="name" label="Name" margin="normal" fieldProps={fieldProps} />
        <TextField name="email" label="Email" margin="normal" fieldProps={fieldProps} />
        <TextField name="password" label="Password" margin="normal" fieldProps={fieldProps} />
        <TextField
          name="passwordConfirm"
          label="Confirm new password"
          margin="normal"
          fieldProps={fieldProps}
          helperText="Enter the same password again to confirm."
        />
        <div className={classes.buttons}>
          {register}
        </div>
      </div>
    );
  }

  render() {
    const { classes, ...rest } = this.props;

    return (
      <Mutator
        collection={RegisterCollection}
        fields={['email', 'password', 'passwordConfirm', 'name']}
        children={this.renderForm}
        operations={this.operations}
        onMutationSuccess={this.handleSuccess}
        defaultValues={{ email: 'noland@advancedwebapps.ca', password: '88888888', name: 'noland' }}
        getSuccessMessageAndAction={this.getSuccessMessageAndAction}
        {...rest}
      />
    );
  }
}

RegisterForm.propTypes = {
  onSuccess: PropTypes.func,
  classes: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
};
RegisterForm.defaultProps = {
  currentUser: null,
  onSuccess: null,
};

RegisterForm = withStyles(styles)(RegisterForm);
export { RegisterForm };
