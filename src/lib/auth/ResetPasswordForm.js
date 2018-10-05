import React, { Component } from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { withRouter, Redirect } from 'react-router';
import { compose } from 'react-apollo';
import { TextField, Mutator } from '../components'; // eslint-disable-line import/no-extraneous-dependencies

import ResetPasswordCollection from '../collections/ResetPassword';

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

const resetPasswordQuery = gql`
  mutation ResetPasswordQuery($email: String!, $token: String!, $password: String!) {
    passwordReset(email: $email, resetToken: $token, password: $password){
      id
    }
  }
`;

class ResetPasswordForm extends Component {
  constructor(props) {
    super(props);
    this.operations = this.buildOperations(props);

    this.state = {
      resetComplete: false,
      readyToRedirect: false,
    };
  }

  buildOperations = props => ({
    resetPassword: {
      mutationQuery: resetPasswordQuery,
      renderButton: this.renderButton,
      handleClick: this.handleClick,
    },
  })

  renderButton = ({ handleClick, loading, result }) => {
    const { classes } = this.props;
    return (
      <Button onClick={handleClick} variant="contained" color="primary" disabled={loading} className={classes.button}>
      Change Password
      </Button>
    );
  }

  getResetParams = () => {
    const params = this.props.match.params;

    return {
      email: params.email,
      token: params.token,
      name: params.name,
    };
  }

  handleClick = async (mutate, { prepareToSaveDoc }, result) => {
    let formValues = await prepareToSaveDoc();
    if(!formValues) return; // must have failed validation

    const { email, token } = this.getResetParams();

    formValues = {
      ...formValues,
      email,
      token,
    };

    mutate({
      variables: { ...formValues },
    });
  }

  handleSuccess = ({ passwordReset }) => {
    this.setState({ resetComplete: true });
    setTimeout(() => this.setState({ readyToRedirect: true }), 2000);
  }

  getSnackbarMessageAndAction = ({ error, data }) => {
    if(error) {
      return {
        message: `
          Your password reset link has either expired or is invalid.
          Please try requesting a password reset again and check your email.
        `,
      };
    }

    return { message: 'You have successfully reset your password.' };
  }

  renderForm = ({ fieldProps, mutationComponents, globalErrors, errors }) => {
    const { resetPassword } = mutationComponents;
    const { classes, className } = this.props;
    const { readyToRedirect } = this.state;

    if(readyToRedirect) return <Redirect to="/" />;

    return(
      <div className={`${classes.form} ${className}`}>
        <Typography variant="body1">
          To reset your password, enter a new, strong password below.
          It must be at least 8 characters long and contain at least
          one lower case letter, one uperrcase letter, one number, and one symbol.
        </Typography>

        <TextField name="password" label="New password" margin="normal" fieldProps={fieldProps} />
        <TextField
          name="passwordConfirm"
          label="Confirm new password"
          margin="normal"
          fieldProps={fieldProps}
          helperText="Enter the same password again to confirm."
        />

        <div className={classes.buttons}>
          {resetPassword}
        </div>
      </div>
    );
  }

  render() {
    const { classes, ...rest } = this.props;

    return (
      <Mutator
        collection={ResetPasswordCollection}
        fields={['password', 'passwordConfirm']}
        children={this.renderForm}
        operations={this.operations}
        onMutationSuccess={this.handleSuccess}
        defaultValues={{ email: 'noland.germain@gmail.com' }}
        getSnackbarMessageAndAction={this.getSnackbarMessageAndAction}
        {...rest}
      />
    );
  }
}

ResetPasswordForm.propTypes = {
  classes: PropTypes.object.isRequired,
  currentUser: PropTypes.object,
  match: PropTypes.object.isRequired,
  className: PropTypes.string,
};
ResetPasswordForm.defaultProps = {
  currentUser: null,
  className: '',
};


ResetPasswordForm = compose(
  withStyles(styles),
  withRouter,
)(ResetPasswordForm);
export { ResetPasswordForm };
