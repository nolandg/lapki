import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Modal from '@material-ui/core/Modal';
import SaveIcon from '@material-ui/icons/Save';
import DeleteIcon from '@material-ui/icons/Delete';
import HelpIcon from '@material-ui/icons/Help';
import CancelIcon from '@material-ui/icons/Cancel';
import EditIcon from '@material-ui/icons/Edit';
import LinearProgress from '@material-ui/core/LinearProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import withMobileDialog from '@material-ui/core/withMobileDialog';

import { CrudMutator } from './CrudMutator'; // eslint-disable-line import/no-extraneous-dependencies

class CrudModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      confirmDialogOpen: false,
    };
  }

  open = () => this.setState({ open: true })

  close = () => this.setState({ open: false })

  renderCreateButton = (handleCreateDoc, loading, result) => (
    <Button onClick={handleCreateDoc} variant="contained" color="primary" disabled={loading}>
      <SaveIcon />Save
    </Button>
  )

  renderUpdateButton = (handleUpdateDoc, loading, result) => (
    <Button onClick={handleUpdateDoc} variant="contained" color="primary" disabled={loading}>
      <SaveIcon /> Save
    </Button>
  )

  renderDeleteButton = (handleDeleteDoc, loading, result) => (
    <Button onClick={handleDeleteDoc} disabled={loading} autoFocus>
      <DeleteIcon /> Delete
    </Button>
  )

  renderCancelButton = handleClose => (
    <Button onClick={handleClose}>
      <CancelIcon /> Cancel
    </Button>
  )

  renderTrigger = handleOpen => (
    <Button onClick={handleOpen} variant="contained" color="secondary">
      <EditIcon />Edit
    </Button>
  )

  renderTitle = () => (
    <Typography variant="title">
      {this.props.title}
    </Typography>
  )

  renderErrors = errors => errors.map(error => <div key={error}>Error: {error}</div>)

  renderContainer = (renderFuncs, mutatorArg) => {
    const { fieldProps, globalErrors, expectedProgress, loading } = mutatorArg;
    const { classes } = this.props;
    const variant = (expectedProgress > 100) && loading ? 'indeterminate' : 'determinate';

    return (
      <div className={classes.modalContainer}>
        {renderFuncs.renderTitle()}
        {renderFuncs.renderErrors(globalErrors)}
        {renderFuncs.renderForm(fieldProps)}
        {renderFuncs.renderButtons(mutatorArg)}
        <LinearProgress variant={variant} value={expectedProgress} />
      </div>
    );
  }

  renderButtons = ({ isNew, crudMutationComponents, loading }) => {
    const { createComponent, updateComponent } = crudMutationComponents;

    return (
      <div className="buttons">
        {isNew ? createComponent : updateComponent}
        <Button onClick={this.handleConfirmDialogOpe} disabled={loading}>
          <DeleteIcon /> Delete
        </Button>
      </div>
    );
  }

  handleMutationSuccess = () => {
    this.close();
  }

  handleConfirmDialogClose = () => {
    this.setState({ confirmDialogOpen: false });
  }

  handleConfirmDialogOpe = () => {
    this.setState({ confirmDialogOpen: true });
  }

  renderConfirmDialog = (deleteComponent) => {
    const { renderDeleteConfirmTitle, renderDeleteConfirmContent, document, classes } = this.props;
    const title = renderDeleteConfirmTitle(document, classes, HelpIcon);
    const content = renderDeleteConfirmContent(document);

    return (
      <Dialog
        fullScreen={this.props.fullScreen}
        open={this.state.confirmDialogOpen}
        onClose={this.handleClose}
        aria-labelledby="delete-confirm-dialog-title"
      >
        <DialogTitle id="delete-confirm-dialog-title">{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{content}</DialogContentText>
        </DialogContent>
        <DialogActions>
          {deleteComponent}
          <Button onClick={this.handleConfirmDialogClose} color="primary" autoFocus>
          Cancel
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  render() {
    const { open } = this.state;
    const { collection, fragmentName, fields, document } = this.props;
    const renderContainer = this.props.renderContainer || this.renderContainer;
    const renderTrigger = this.props.renderTrigger || this.renderTrigger;

    const renderCreateButton = this.props.renderCreateButton || this.renderCreateButton;
    const renderUpdateButton = this.props.renderUpdateButton || this.renderUpdateButton;
    const renderDeleteButton = this.props.renderDeleteButton || this.renderDeleteButton;

    const renderFuncs = {
      renderForm: this.props.renderForm || this.renderForm,
      renderButtons: this.props.renderButtons || this.renderButtons,
      renderCancelButton: this.props.renderCancelButton || this.renderCancelButton,
      renderTitle: this.props.renderTitle || this.renderTitle,
      renderErrors: this.props.renderErrors || this.renderErrors,
    };

    return (
      <CrudMutator
        collection={collection}
        fragmentName={fragmentName}
        fields={fields}
        document={document}
        renderCreateButton={renderCreateButton}
        renderUpdateButton={renderUpdateButton}
        renderDeleteButton={renderDeleteButton}
        onMutationSuccess={this.handleMutationSuccess}
      >
        {mutatorArg => (
          <div>
            {renderTrigger(this.open)}
            <Modal open={open} onClose={this.close}>
              {renderContainer(renderFuncs, mutatorArg)}
            </Modal>
            {this.renderConfirmDialog(mutatorArg.crudMutationComponents.deleteComponent)}
          </div>
        )}
      </CrudMutator>
    );
  }
}

CrudModal.propTypes = {
  classes: PropTypes.object.isRequired,
  renderForm: PropTypes.func.isRequired,
  renderTrigger: PropTypes.func,
  renderContainer: PropTypes.func,
  renderButtons: PropTypes.func,
  renderCreateButton: PropTypes.func,
  renderUpdateButton: PropTypes.func,
  renderDeleteButton: PropTypes.func,
  renderCancelButton: PropTypes.func,
  renderTitle: PropTypes.func,
  renderErrors: PropTypes.func,
  title: PropTypes.string,
  document: PropTypes.object,
  collection: PropTypes.object.isRequired,
  fragmentName: PropTypes.string,
  fields: PropTypes.array.isRequired,
  fullScreen: PropTypes.bool,
  renderDeleteConfirmTitle: PropTypes.func,
  renderDeleteConfirmContent: PropTypes.func,
};
CrudModal.defaultProps = {
  renderTrigger: null,
  renderContainer: null,
  renderButtons: null,
  renderCreateButton: null,
  renderUpdateButton: null,
  renderDeleteButton: null,
  renderCancelButton: null,
  renderTitle: null,
  renderErrors: null,
  title: 'Edit',
  fragmentName: 'default',
  document: undefined,
  fullScreen: false,
  renderDeleteConfirmTitle: (doc, classes, Icon) => <span className={classes.confirmDeleteTitle}><Icon className={classes.confirmDeleteHelpIcon} />Confirm Delete</span>,
  renderDeleteConfirmContent: doc => 'Are you sure you want to delete this?',
};

CrudModal = withMobileDialog()(CrudModal);

CrudModal.defaultStyles = (theme => ({
  modalContainer: {
    position: 'absolute',
    width: theme.spacing.unit * 50,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  circularProgress: {
    height: '.5em',
  },
  confirmDeleteTitle: {
    display: 'flex',
    alignItems: 'center',
  },
  confirmDeleteHelpIcon: {
    fontSize: '35px',
    marginRight: theme.spacing.unit,
  },
}));

export { CrudModal };
