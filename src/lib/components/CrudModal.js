import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
// import Typography from '@material-ui/core/Typography';
import SaveIcon from '@material-ui/icons/Save';
import DeleteIcon from '@material-ui/icons/Delete';
import HelpIcon from '@material-ui/icons/Help';
import CancelIcon from '@material-ui/icons/Cancel';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import LinearProgress from '@material-ui/core/LinearProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import withMobileDialog from '@material-ui/core/withMobileDialog';
import _ from 'lodash';

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

  isNew = () => !_.get(this.props, 'document.id')

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

  renderConfirmDeleteButton = (handleDeleteDoc, loading, result) => (
    <Button onClick={handleDeleteDoc} disabled={loading} autoFocus>
      <DeleteIcon /> Delete
    </Button>
  )

  renderDeleteButton = (handleConfirmDialogOpen, loading, result) => (
    <Button onClick={handleConfirmDialogOpen} disabled={loading}>
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
      {this.isNew() ? <AddIcon /> : <EditIcon /> }
      {this.isNew() ? 'Create' : 'Edit / Delete'}
    </Button>
  )

  renderTitle = document => (
    <span><EditIcon />{this.props.title}</span>
  )

  renderError = (error) => {
    const { classes } = this.props;
    return (
      <div key={error} className={classes.error}>
        Error: {error}
      </div>
    );
  }

  renderErrors = (errors) => {
    const { classes } = this.props;
    const renderError = this.props.renderError || this.renderError;

    return (
      <div className={classes.errorList}>
        {errors.map(renderError)}
      </div>
    );
  }

  renderDialogParts = (renderFuncs, mutatorArg) => {
    const { fieldProps, globalErrors, expectedProgress, loading } = mutatorArg;
    const { classes, document } = this.props;
    const variant = (expectedProgress > 100) && loading ? 'indeterminate' : 'determinate';

    return [
      <DialogTitle key="title">{renderFuncs.renderTitle(document)}</DialogTitle>,
      <DialogContent key="content">
        {renderFuncs.renderErrors(globalErrors)}
        {renderFuncs.renderForm(fieldProps)}
      </DialogContent>,
      <DialogActions key="actions" className={classes.dialogActions}>
        {renderFuncs.renderButtons(renderFuncs, mutatorArg)}
      </DialogActions>,
      <LinearProgress variant={variant} value={expectedProgress} key="progress" className={classes.linearProgress} />,
    ];
  }

  renderButtons = (renderFuncs, { isNew, mutationComponents, loading, result }) => {
    const { create, update } = mutationComponents;

    return (
      <div>
        {renderFuncs.renderCancelButton(this.close, loading, result)}
        {renderFuncs.renderDeleteButton(this.handleConfirmDialogOpen, loading, result)}
        {isNew ? create : update}
      </div>
    );
  }

  handleMutationSuccess = () => {
    this.close();
  }

  handleConfirmDialogClose = () => {
    this.setState({ confirmDialogOpen: false });
  }

  handleConfirmDialogOpen = () => {
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
    const { collection, fragmentName, fields, document, classes } = this.props;
    const renderDialogParts = this.props.renderDialogParts || this.renderDialogParts;
    const renderTrigger = this.props.renderTrigger || this.renderTrigger;

    const renderCreateButton = this.props.renderCreateButton || this.renderCreateButton;
    const renderUpdateButton = this.props.renderUpdateButton || this.renderUpdateButton;
    const renderConfirmDeleteButton = this.props.renderConfirmDeleteButton || this.renderConfirmDeleteButton;

    const renderFuncs = {
      renderForm: this.props.renderForm || this.renderForm,
      renderButtons: this.props.renderButtons || this.renderButtons,
      renderCancelButton: this.props.renderCancelButton || this.renderCancelButton,
      renderTitle: this.props.renderTitle || this.renderTitle,
      renderErrors: this.props.renderErrors || this.renderErrors,
      renderDeleteButton: this.props.renderDeleteButton || this.renderDeleteButton,
    };

    return (
      <CrudMutator
        collection={collection}
        fragmentName={fragmentName}
        fields={fields}
        document={document}
        renderCreateButton={renderCreateButton}
        renderUpdateButton={renderUpdateButton}
        renderDeleteButton={renderConfirmDeleteButton}
        onMutationSuccess={this.handleMutationSuccess}
      >
        {mutatorArg => (
          <div>
            {renderTrigger(this.open)}
            <Dialog open={open} onClose={this.close} fullScreen={this.props.fullScreen} classes={{ paper: classes.dialogPaper }}>
              {renderDialogParts(renderFuncs, mutatorArg)}
            </Dialog>
            {this.renderConfirmDialog(mutatorArg.mutationComponents.delete)}
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
  renderDialogParts: PropTypes.func,
  renderButtons: PropTypes.func,
  renderCreateButton: PropTypes.func,
  renderUpdateButton: PropTypes.func,
  renderDeleteButton: PropTypes.func,
  renderConfirmDeleteButton: PropTypes.func,
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
  renderError: PropTypes.func,
};
CrudModal.defaultProps = {
  renderTrigger: null,
  renderDialogParts: null,
  renderButtons: null,
  renderCreateButton: null,
  renderUpdateButton: null,
  renderDeleteButton: null,
  renderConfirmDeleteButton: null,
  renderCancelButton: null,
  renderError: null,
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

CrudModal.defaultStyles = theme => ({
  dialogPaper: {
    position: 'relative',
  },
  dialogActions: {
    marginBottom: theme.spacing.unit * 6,
  },
  circularProgress: {
    height: '.5em',
  },
  confirmDeleteHelpIcon: {
    fontSize: '35px',
    marginRight: theme.spacing.unit,
  },
  linearProgress: {
    position: 'absolute',
    height: '32px',
    left: '0',
    right: '0',
    bottom: '0',
  },
});

export { CrudModal };
