import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { compose } from 'react-apollo';
import { withRouter } from 'react-router';
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { withUser } from '../HOCs'; // eslint-disable-line import/no-extraneous-dependencies

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { RequestPasswordResetForm } from './RequestPasswordResetForm';
import { LogoutButton } from './LogoutButton';

const styles = theme => ({
  tab: {
    minWidth: 0,
  },
  tabLabelContainer: {
    padding: {
      top: theme.spacing.unit * 1,
      bottom: theme.spacing.unit * 1,
      left: theme.spacing.unit * 1,
      right: theme.spacing.unit * 1,
    },
  },
  extras: {
    '& > div': {
      display: 'flex',
      alignItems: 'center',
      margin: {
        top: theme.spacing.unit * -1,
        bottom: theme.spacing.unit * 0,
      },
    },

    '& > div:first-child': {
      margin: {
        top: theme.spacing.unit * 2,
      },
    },
  },
});

const TabContainer = ({ children }) => (
  <div>
    {children}
  </div>
);
TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

class AuthenticationForm extends Component {
  constructor(props) {
    super(props);

    const { currentUser } = props;
    const isLoggedIn = currentUser && currentUser.isAuthenticated;
    let activeTab = props.initialTab;

    // We cannot be on a tab that should be disabled
    if(isLoggedIn && ['Login', 'Register', 'PasswordReset'].includes(activeTab)) {
      activeTab = 'Logout';
    }
    if(!isLoggedIn && ['Logout'].includes(activeTab)) {
      activeTab = 'Login';
    }

    this.state = { activeTab };
  }

  handleTabChange = (event, activeTab) => {
    this.setState({ activeTab });
  }

  handleSuccess = () => {
    const{ onSuccess } = this.props;
    if(onSuccess) onSuccess();
  }

  renderLoginTab = () => (
    <TabContainer>
      <LoginForm onSuccess={this.handleSuccess} />
      <div className={this.props.classes.extras}>
        <div>
          <Typography>
            Don't have an account?
          </Typography>
          <Button color="primary" onClick={() => this.handleTabChange(null, 'Register')}>
              Register now
          </Button>
        </div>
        <div>
          <Typography>
          Forgot your password?
          </Typography>
          <Button color="primary" onClick={() => this.handleTabChange(null, 'PasswordReset')}>
            Reset your password
          </Button>
        </div>
      </div>
    </TabContainer>
  )

  renderRegisterTab = () => (
    <TabContainer>
      <RegisterForm onSuccess={this.handleSuccess} />
      <div className={this.props.classes.extras}>
        <div>
          <Typography>
            Already have an account?
          </Typography>
          <Button color="primary" onClick={() => this.handleTabChange(null, 'Login')}>
              Login
          </Button>
        </div>
      </div>
    </TabContainer>
  )

  renderPasswordResetTab = () => (
    <TabContainer>
      <RequestPasswordResetForm onSuccess={this.handleSuccess} />
    </TabContainer>
  )

  renderLogoutTab = () => (
    <TabContainer>
      <LogoutButton onSuccess={this.handleSuccess} />
    </TabContainer>
  )

  render() {
    const { currentUser, classes } = this.props;
    const { activeTab } = this.state;

    const isLoggedIn = currentUser && currentUser.isAuthenticated;
    const tabClasses = { root: classes.tab, labelContainer: classes.tabLabelContainer };
    return (
      <Fragment>
        <Tabs
          value={activeTab}
          indicatorColor="primary"
          textColor="primary"
          onChange={this.handleTabChange}
        >
          <Tab value="Login" label="Login" disabled={isLoggedIn} classes={tabClasses} />
          <Tab value="Register" label="Register" disabled={isLoggedIn} classes={tabClasses} />
          <Tab value="PasswordReset" label="Reset Password" disabled={isLoggedIn} classes={tabClasses} />
          <Tab value="Logout" label="Logout" disabled={!isLoggedIn} classes={tabClasses} />
        </Tabs>
        {activeTab ? this[`render${activeTab}Tab`]() : null}
      </Fragment>
    );
  }
}

AuthenticationForm.propTypes = {
  // className: PropTypes.string,
  // match: PropTypes.object.isRequired,
  onSuccess: PropTypes.func,
  currentUser: PropTypes.object,
  classes: PropTypes.object.isRequired,
  initialTab: PropTypes.string,
};
AuthenticationForm.defaultProps = {
  className: '',
  currentUser: null,
  initialTab: 'Login',
  onSuccess: null,
};

AuthenticationForm = compose(
  withStyles(styles),
  withRouter,
  withUser,
)(AuthenticationForm);

export { AuthenticationForm };
