import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
// import Typography from '@material-ui/core/Typography';
import SaveIcon from '@material-ui/icons/Save';
import DeleteIcon from '@material-ui/icons/Delete';
import CancelIcon from '@material-ui/icons/Cancel';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import LinearProgress from '@material-ui/core/LinearProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import withMobileDialog from '@material-ui/core/withMobileDialog';
import _ from 'lodash';

import { CrudMutator } from './CrudMutator'; // eslint-disable-line import/no-extraneous-dependencies

class CrudModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  open = () => this.setState({ open: true })

  close = () => this.setState({ open: false })

  isNew = () => !_.get(this.props, 'document.id')

  renderCreateButton = ({ handleClick, loading, result }) => (
    <Button onClick={handleClick} variant="contained" color="primary" disabled={loading}>
      <SaveIcon /><span>Save</span>
    </Button>
  )

  renderUpdateButton = ({ handleClick, loading, result }) => (
    <Button onClick={handleClick} variant="contained" color="primary" disabled={loading}>
      <SaveIcon /><span>Save</span>
    </Button>
  )

  renderDeleteButton = ({ handleClick, loading, result }) => (
    <Button onClick={handleClick} disabled={loading}>
      <DeleteIcon /><span>Delete</span>
    </Button>
  )

  renderCancelButton = ({ handleClick, loading, result }) => (
    <Button onClick={handleClick}>
      <CancelIcon /><span>Cancel</span>
    </Button>
  )

  renderTrigger = handleOpen => (
    <Button onClick={handleOpen} variant="contained" color="primary">
      {this.isNew() ? <AddIcon /> : <EditIcon /> }
      <span>{this.isNew() ? 'Create' : 'Edit / Delete'}</span>
    </Button>
  )

  renderTitle = document => (
    <Fragment><EditIcon /><span>{this.props.title}</span></Fragment>
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
    const { fieldProps, expectedProgress, loading } = mutatorArg;
    const { classes, document } = this.props;
    const variant = (expectedProgress > 100) && loading ? 'indeterminate' : 'determinate';

    return [
      <DialogTitle key="title" className={classes.title}>{renderFuncs.renderTitle(document)}</DialogTitle>,
      <DialogContent key="content">
        {/* {renderFuncs.renderErrors(globalErrors)} */}
        {renderFuncs.renderForm(fieldProps)}
      </DialogContent>,
      <DialogActions key="actions" className={classes.dialogActions}>
        {renderFuncs.renderButtons(renderFuncs, mutatorArg)}
      </DialogActions>,
      <LinearProgress variant={variant} value={expectedProgress} key="progress" className={classes.linearProgress} />,
    ];
  }

  renderButtons = (renderFuncs, { isNew, mutationComponents, loading, result, requestDelete }) => {
    const { create, update } = mutationComponents;

    return (
      <div>
        {renderFuncs.renderCancelButton({ handleClick: this.close, loading, result })}
        <Button onClick={requestDelete} disabled={loading}>
          <DeleteIcon /><span>Delete</span>
        </Button>
        {isNew ? create : update}
      </div>
    );
  }

  handleMutationSuccess = () => {
    this.close();
  }

  handleClick = (event) => {
    event.stopPropagation();
  }

  render() {
    const { open } = this.state;
    const { collection, fragmentName, fields, document, classes, ...rest } = this.props;
    const renderDialogParts = this.props.renderDialogParts || this.renderDialogParts;
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
      renderDeleteButton: this.props.renderDeleteButton || this.renderDeleteButton,
    };

    return (
      <CrudMutator
        {...rest}
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
          <div onClick={this.handleClick}> {/* eslint-disable-line */}
            {renderTrigger(this.open)}
            <Dialog
              open={open}
              onClose={this.close}
              fullScreen={this.props.fullScreen}
              classes={{ paper: classes.dialogPaper }}
            >
              {renderDialogParts(renderFuncs, mutatorArg)}
            </Dialog>
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
  renderCancelButton: null,
  renderError: null,
  renderTitle: null,
  renderErrors: null,
  title: 'Edit',
  fragmentName: 'default',
  document: undefined,
  fullScreen: false,
  renderDeleteConfirmTitle: (doc, classes, Icon) => <Fragment><Icon />Confirm Delete</Fragment>,
  renderDeleteConfirmContent: doc => 'Are you sure you want to delete this?',
};

CrudModal = withMobileDialog()(CrudModal);

CrudModal.defaultStyles = theme => ({
  dialogPaper: {
    position: 'relative',
    padding: 0,
  },
  dialogActions: {
    marginBottom: theme.spacing.unit * 6,
  },
  circularProgress: {
    height: '.5em',
  },
  title: {
    '& > *': {
      display: 'flex',
      alignItems: 'center',
      '& svg': {
        fontSize: '35px',
        marginRight: theme.spacing.unit,
      },
    },
  },
  confirmDeleteTitle: {
    '& > *': {
      display: 'flex',
      alignItems: 'center',
      '& svg': {
        fontSize: '35px',
        marginRight: theme.spacing.unit,
      },
    },
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
