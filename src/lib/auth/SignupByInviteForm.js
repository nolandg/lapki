import React, { Component } from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { withRouter, Redirect } from 'react-router';
import { compose } from 'react-apollo';
import { TextField, Mutator } from '../components'; // eslint-disable-line import/no-extraneous-dependencies

import SignupByInviteCollection from '../collections/SignupByInvite';

const styles = theme => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  button: {
    marginTop: theme.spacing.unit * 4,

    [`@media (min-width: ${theme.breakpoints.values.sm}px)`]: {
      marginTop: theme.spacing.unit * 6,
    },
  },
});

const signupQuery = gql`
  mutation SignupByInvite($email: String!, $token: String!, $password: String!, $name: String!) {
    signupByInvite(data: {email: $email, inviteToken: $token, password: $password, name: $name}){
      id
      name
      email
    }
  }
`;

class SignupByInviteForm extends Component {
  constructor(props) {
    super(props);
    this.operations = this.buildOperations(props);

    this.state = {
      signupComplete: false,
      readyToRedirect: false,
    };
  }

  buildOperations = props => ({
    signup: {
      mutationQuery: signupQuery,
      renderButton: this.renderButton,
      handleClick: this.handleClick,
    },
  })

  renderButton = ({ handleClick, loading, result }) => {
    const { classes } = this.props;
    return (
      <Button onClick={handleClick} variant="contained" color="primary" disabled={loading} className={classes.button}>
        Confirm Account
      </Button>
    );
  }

  handleClick = async (mutate, { prepareToSaveDoc }, result) => {
    const formValues = await prepareToSaveDoc();
    if(!formValues) return; // must have failed validation
    const { email, token } = this.props.match.params;

    mutate({ variables: { ...formValues, token, email } });
  }

  handleSuccess = () => {
    this.setState({ signupComplete: true });
    setTimeout(() => this.setState({ readyToRedirect: true }), 2000);
  }

  getSnackbarMessageAndAction = ({ error, data }) => {
    if(error) {
      return {
        message: `
          Your invitation links looks invalid or expired.
          Please try requesting an invitation again.
        `,
      };
    }
    console.log('Data: ', data);
    return { message: `Account confirmed. You are now logged in as "${data.signupByInvite.name}".` };
  }

  renderForm = ({ fieldProps, mutationComponents, globalErrors, errors }) => {
    const { signup } = mutationComponents;
    const { classes, className } = this.props;
    const { readyToRedirect } = this.state;
    const { email } = this.props.match.params;

    if(readyToRedirect) return <Redirect to="/" />;

    return(
      <div className={`${classes.form} ${className}`}>
        <Typography variant="body1">
          Please complete the form below to confirm your account for email address "{email}".
        </Typography>

        <TextField
          name="name"
          label="Name"
          margin="normal"
          autoComplete="on"
          fieldProps={fieldProps}
        />
        <TextField name="password" type="password" label="Password" margin="normal" autoComplete="on" fieldProps={fieldProps} />
        <TextField
          type="password"
          name="passwordConfirm"
          label="Confirm new password"
          margin="normal"
          fieldProps={fieldProps}
          helperText="Enter the same password again to confirm."
        />

        <div className={classes.buttons}>
          {signup}
        </div>
      </div>
    );
  }

  render() {
    const { classes, ...rest } = this.props;

    return (
      <Mutator
        collection={SignupByInviteCollection}
        fields={['password', 'passwordConfirm', 'name']}
        children={this.renderForm}
        operations={this.operations}
        onMutationSuccess={this.handleSuccess}
        getSnackbarMessageAndAction={this.getSnackbarMessageAndAction}
        {...rest}
      />
    );
  }
}

SignupByInviteForm.propTypes = {
  classes: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
  match: PropTypes.object.isRequired,
  className: PropTypes.string,
};
SignupByInviteForm.defaultProps = {
  currentUser: null,
  className: '',
};


SignupByInviteForm = compose(
  withStyles(styles),
  withRouter,
)(SignupByInviteForm);
export { SignupByInviteForm };
