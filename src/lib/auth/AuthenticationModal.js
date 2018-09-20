import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
// import Typography from '@material-ui/core/Typography';
import { compose } from 'react-apollo';
import { withRouter } from 'react-router';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import withMobileDialog from '@material-ui/core/withMobileDialog';

import { withUser } from '../HOCs'; // eslint-disable-line import/no-extraneous-dependencies
import { AuthenticationForm } from './AuthenticationForm';

const styles = theme => ({
  title: {
    position: 'relative',
    '& button': {
      position: 'absolute',
      top: 0,
      right: 0,
    },
  },
});

class AuthenticationModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  isControlled = () => this.props.open !== undefined

  handleClose = () => {
    if(this.isControlled() && this.props.onClose()) {
      this.props.onClose();
    }else{
      this.setState({ open: false });
    }
  }

  handleOpen = () => {
    this.setState({ open: true });
  }

  handleSuccess = () => {
    setTimeout(() => this.handleClose(), 3000);
  }

  render() {
    const { fullScreen, isAuthenticated, children, currentUser, open: openProp, classes } = this.props;
    const open = this.isControlled() ? openProp : this.state.open;

    return (
      <React.Fragment>
        {children && children({ isAuthenticated, currentUser, open: this.handleOpen })}
        <Dialog
          fullScreen={fullScreen}
          open={open}
          onClose={this.handleClose}
          aria-labelledby="delete-confirm-dialog-title"
        >
          <DialogTitle className={classes.title}>
            <span>{isAuthenticated ? 'Logout' : 'Login / Register'}</span>
            <IconButton onClick={this.handleClose}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            <AuthenticationForm onSuccess={this.handleSuccess} />
          </DialogContent>
        </Dialog>
      </React.Fragment>
    );
  }
}

AuthenticationModal.propTypes = {
  // className: PropTypes.object,
  // match: PropTypes.object.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
  currentUser: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  fullScreen: PropTypes.bool.isRequired,
  children: PropTypes.func,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
AuthenticationModal.defaultProps = {
  // className: '',
  // currentUser: null,
  open: undefined,
  children: null,
  onClose: null,
};

AuthenticationModal = compose(
  withStyles(styles),
  withRouter,
  withUser,
  withMobileDialog(),
)(AuthenticationModal);

export { AuthenticationModal };
