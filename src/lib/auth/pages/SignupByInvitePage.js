import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { compose } from 'react-apollo';
import { withRouter } from 'react-router';
import Typography from '@material-ui/core/Typography';

import { SignupByInviteForm } from '../SignupByInviteForm';

const styles = theme => ({
});

const SignupByInvitePage = ({ classes, Layout, match: { params: { name } } }) => (
  <Layout>
    <Typography variant="h3" align="center" gutterBottom>Confirm Account</Typography>
    <br />
    <SignupByInviteForm />
  </Layout>
);

SignupByInvitePage.propTypes = {
  Layout: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]).isRequired,
  match: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};


const SignupByInvitePageEnhanced = compose(
  withStyles(styles),
  withRouter,
)(SignupByInvitePage);
export { SignupByInvitePageEnhanced as SignupByInvitePage };
