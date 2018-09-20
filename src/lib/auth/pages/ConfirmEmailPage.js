import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { compose } from 'react-apollo';
import { withRouter } from 'react-router';
import Typography from '@material-ui/core/Typography';

import { ConfirmEmailButton } from '../ConfirmEmailButton';

const styles = theme => ({
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: theme.spacing.unit * 4,

    [`@media (min-width: ${theme.breakpoints.values.sm}px)`]: {
      marginTop: theme.spacing.unit * 6,
    },
  },
});

const ConfirmEmailPage = ({ classes, Layout, match: { params: { name } } }) => (
  <Layout>
    <Typography variant="display2" align="center" gutterBottom>Confirm Your Email</Typography>
    <br />
    <Typography variant="title">Hi {name},</Typography>
    <Typography variant="body1">
      To keep your account active, you must confirm your email. Simply click the button below:
    </Typography>
    <div className={classes.buttons}><ConfirmEmailButton className={classes.button} /></div>
  </Layout>
);

ConfirmEmailPage.propTypes = {
  Layout: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]).isRequired,
  match: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};


const ConfirmEmailPageEnhanced = compose(
  withStyles(styles),
  withRouter,
)(ConfirmEmailPage);
export { ConfirmEmailPageEnhanced as ConfirmEmailPage };
