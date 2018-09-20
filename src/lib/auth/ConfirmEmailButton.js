import React, { Component } from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { compose } from 'react-apollo';
import { withRouter, Redirect } from 'react-router';
import { Mutator } from '../components'; // eslint-disable-line import/no-extraneous-dependencies

import ConfirmEmailCollection from '../collections/ConfirmEmail';

const styles = theme => ({

});

const confirmEmailQuery = gql`
  mutation ConfirmEmailQuery($email: String!, $token: String!) {
    confirmEmail(email: $email, emailConfirmToken: $token){
      token
    }
  }
`;

class ConfirmEmailButton extends Component {
  constructor(props) {
    super(props);
    this.operations = this.buildOperations(props);
    this.state = {
      mutationComplete: false,
      readyToRedirect: false,
    };
  }

  buildOperations = props => ({
    confirmEmail: {
      mutationQuery: confirmEmailQuery,
      renderButton: this.renderButton,
      handleClick: this.handleClick,
    },
  })

  renderButton = ({ handleClick, loading, result }) => (
    <Button
      onClick={handleClick}
      variant="contained"
      color="primary"
      disabled={loading}
      className={this.props.className}
      size="large"
    >
      Confirm Email
    </Button>
  )

  handleClick = async (mutate, { prepareToSaveDoc, startMutation }, result) => {
    const params = this.props.match.params;

    startMutation();
    mutate({
      variables: {
        email: params.email,
        token: params.token,
      },
    });
  }

  handleSuccess = ({ confirmEmail }) => {
    this.setState({ mutationComplete: true });
    setTimeout(() => this.setState({ readyToRedirect: true }), 2000);
  }

  getSnackbarMessageAndAction = ({ error, data }) => {
    if(error) {
      return {
        message: `
          Your email confirmation link appears to be invalid.
          Please contact technical support.
        `,
      };
    }

    return { message: 'You have successfully confirmed your email.' };
  }

  renderForm = ({ fieldProps, mutationComponents, globalErrors, errors }) => {
    const { confirmEmail } = mutationComponents;
    const { readyToRedirect } = this.state;

    if(readyToRedirect) return <Redirect to="/" />;

    return confirmEmail;
  }

  render() {
    return (
      <Mutator
        collection={ConfirmEmailCollection}
        fields={[]}
        children={this.renderForm}
        operations={this.operations}
        onMutationSuccess={this.handleSuccess}
        getSnackbarMessageAndAction={this.getSnackbarMessageAndAction}
        {...this.props}
      />
    );
  }
}

ConfirmEmailButton.propTypes = {
  classes: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  className: PropTypes.string,
};
ConfirmEmailButton.defaultProps = {
  className: '',
};

ConfirmEmailButton = compose(
  withStyles(styles),
  withRouter,
)(ConfirmEmailButton);

export { ConfirmEmailButton };
