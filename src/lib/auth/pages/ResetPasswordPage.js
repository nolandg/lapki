import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { compose } from 'react-apollo';
import { withRouter } from 'react-router';
import Typography from '@material-ui/core/Typography';

import { ResetPasswordForm } from '../ResetPasswordForm';

const styles = theme => ({
});

const ResetPasswordPage = ({ classes, Layout, match: { params: { name } } }) => (
  <Layout>
    <Typography variant="h3" align="center" gutterBottom>Reset Password</Typography>
    <br />
    <Typography variant="h6">Hi {name},</Typography>
    <ResetPasswordForm />
  </Layout>
);

ResetPasswordPage.propTypes = {
  Layout: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]).isRequired,
  match: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};


const ResetPasswordPageEnhanced = compose(
  withStyles(styles),
  withRouter,
)(ResetPasswordPage);
export { ResetPasswordPageEnhanced as ResetPasswordPage };
