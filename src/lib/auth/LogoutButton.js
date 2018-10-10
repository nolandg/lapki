import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import { withUser } from '../HOCs/withUser'; // eslint-disable-line import/no-extraneous-dependencies

class LogoutButton extends Component {
  handleClick = () => {
    const{ logout, onSuccess } = this.props;
    logout();
    if(onSuccess) onSuccess();
  }

  render() {
    const { currentUserLoading } = this.props;

    return (
      <Button onClick={this.handleClick} variant="contained" color="primary" disabled={currentUserLoading}>
        Logout
      </Button>
    );
  }
}

LogoutButton.propTypes = {
  logout: PropTypes.func.isRequired,
  currentUserLoading: PropTypes.bool.isRequired,
  onSuccess: PropTypes.func,
};
LogoutButton.defaultProps = {
  onSuccess: null,
};

const styles = theme => ({
});

LogoutButton = withStyles(styles)(withUser(LogoutButton));
export { LogoutButton };
