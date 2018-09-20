import React, { Component } from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { TextField, Mutator } from '../components'; // eslint-disable-line import/no-extraneous-dependencies

import LoginCollection from '../collections/Login';

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

const loginQuery = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password){
      token
    }
  }
`;

class LoginForm extends Component {
  constructor(props) {
    super(props);
    this.operations = this.buildOperations(props);
  }

  buildOperations = props => ({
    login: {
      mutationQuery: loginQuery,
      renderButton: this.renderLoginButton,
      handleClick: this.handleLoginClick,
    },
  })

  renderLoginButton = ({ handleClick, loading, result }) => (
    <Button onClick={handleClick} variant="contained" color="primary" disabled={loading}>
      Login
    </Button>
  )

  handleLoginClick = async (mutate, { prepareToSaveDoc, startMutation }, result) => {
    const loginDetails = await prepareToSaveDoc();
    if(!loginDetails) return; // must have failed validation

    startMutation();
    mutate({
      variables: { ...loginDetails },
    });
  }

  handleLoginSuccess = ({ login }) => {
    if(this.props.onSuccess) this.props.onSuccess();
  }

  getSuccessMessageAndAction = ({ data, hackToGetDoc }) => ({ message: (
    <span>
        You are now logged in as <em>{hackToGetDoc.email}</em>
    </span>
  ) })

  renderForm = ({ fieldProps, mutationComponents, globalErrors, errors }) => {
    const { login } = mutationComponents;
    const { classes } = this.props;
    return(
      <div className={classes.form}>
        <TextField name="email" label="Email" margin="normal" fieldProps={fieldProps} />
        <TextField name="password" label="Password" margin="normal" fieldProps={fieldProps} />
        <div className={classes.buttons}>
          {login}
        </div>
      </div>
    );
  }

  render() {
    return (
      <Mutator
        collection={LoginCollection}
        fields={['email', 'password']}
        children={this.renderForm}
        operations={this.operations}
        onMutationSuccess={this.handleLoginSuccess}
        defaultValues={{ email: 'noland.germain@gmail.com', password: 'powtowngetdown9875' }}
        getSuccessMessageAndAction={this.getSuccessMessageAndAction}
        {...this.props}
      />
    );
  }
}

LoginForm.propTypes = {
  onSuccess: PropTypes.func,
  classes: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
};
LoginForm.defaultProps = {
  currentUser: null,
  onSuccess: null,
};

LoginForm = withStyles(styles)(LoginForm);
export { LoginForm };
