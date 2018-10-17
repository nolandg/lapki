import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import DeleteIcon from '@material-ui/icons/Delete';
import HelpIcon from '@material-ui/icons/Help';
import CancelIcon from '@material-ui/icons/Cancel';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import withMobileDialog from '@material-ui/core/withMobileDialog';
import { compose } from 'react-apollo';
import { withStyles } from '@material-ui/core/styles';

import buildMutation from '../utils/buildMutation';
import { Mutator } from './Mutator';
import { camelToPascal } from '../utils/stringUtils';

const styles = theme => ({
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
});

class CrudMutator extends Component {
  constructor(props) {
    super(props);
    this.state = { confirmDialogOpen: false };
    this.operations = this.buildOperations(props);
  }

  buildOperations = (props) => {
    const { collection, fragmentName, onSaveSuccess, onSaveError } = props;

    const buildOperation = op => ({
      mutationQuery: buildMutation(op, collection, fragmentName),
      renderButton: props[`render${camelToPascal(op)}Button`],
      handleClick: this[`handle${camelToPascal(op)}Doc`],
      onSuccess: props[`on${camelToPascal(op)}Success`],
      onError: props[`on${camelToPascal(op)}Error`],
    });

    const operations = {
      create: buildOperation('create'),
      update: buildOperation('update'),
      delete: buildOperation('delete'),
    };


    // // Intercept the delete operation so we can add confirm dialog
    // operations.delete.handleClick = () => { this.setState({ confirmDialogOpen: true }); };
    // operations.delete.renderButton = ({ handleClick, loading, result }) => (
    //   <Button onClick={handleClick} disabled={loading}>
    //     <DeleteIcon /><span>Delete</span>
    //   </Button>
    // );

    // If not provided with create or update buttons, use provided save button instead
    // Allows collapsing create and update into save
    if(!operations.create.renderButton && props.renderSaveButton) {
      operations.create.renderButton = props.renderSaveButton;
    }
    if(!operations.update.renderButton && props.renderSaveButton) {
      operations.update.renderButton = props.renderSaveButton;
    }

    // If provided with onSave[Success/Error], use that instead
    if(onSaveSuccess) {
      operations.create.onSuccess = onSaveSuccess;
      operations.update.onSuccess = onSaveSuccess;
    }
    if(onSaveError) {
      operations.create.onError = onSaveError;
      operations.update.onError = onSaveError;
    }

    // Automatically supress rendering of delete button for new docs
    operations.delete.renderButton = (...args) => {
      if(args[0].isNew) return null;
      return props.renderDeleteButton(...args);
    };

    return operations;
  }

  handleCreateDoc = async (mutate, { prepareToSaveDoc }, result) => {
    const doc = await prepareToSaveDoc();
    if(!doc) return; // must have failed validation
    mutate({
      variables: {
        data: doc,
      },
    });
  }

  handleUpdateDoc = async (mutate, { prepareToSaveDoc }, result) => {
    const doc = await prepareToSaveDoc();
    if(!doc) return; // must have failed validation
    const id = _.get(this.props, 'document.id');
    if(!id) throw Error('Cannot update a document without id.');

    // We can't send id for updates
    delete doc.id;

    mutate({
      variables: {
        where: { id },
        data: doc,
      },
    });
  }

  handleDeleteDoc = async (mutate, { clearErrors }, result) => {
    clearErrors();
    const id = _.get(this.props, 'document.id');
    if(!id) throw Error('Cannot delete a document without id.');

    mutate({
      variables: {
        where: { id },
      },
    });
  }

  renderConfirmDialog = (deleteMutationComponent) => {
    const { renderDeleteConfirmTitle, renderDeleteConfirmContent, document, classes } = this.props;
    const title = document ? renderDeleteConfirmTitle(document, classes, HelpIcon) : '';
    const content = document ? renderDeleteConfirmContent(document) : '';

    return (
      <Dialog
        fullScreen={this.props.fullScreen}
        open={this.state.confirmDialogOpen}
        onClose={this.handleClose}
        aria-labelledby="delete-confirm-dialog-title"
      >
        <DialogTitle id="delete-confirm-dialog-title" className={classes.confirmDeleteTitle}>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{content}</DialogContentText>
        </DialogContent>
        <DialogActions>
          {deleteMutationComponent}
          <Button onClick={() => this.setState({ confirmDialogOpen: false })} color="primary" autoFocus>
            <CancelIcon /><span>Cancel</span>
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  openConfirmDialog = () => {
    this.setState({ confirmDialogOpen: true });
  }

  render() {
    const { fields, children, classes, ...rest } = this.props;

    return (
      <Fragment>
        <Mutator operations={this.operations} fields={fields} {...rest}>
          {(mutatorArg) => {
            mutatorArg.requestDelete = this.openConfirmDialog;
            return (
              <Fragment>
                {this.renderConfirmDialog(mutatorArg.mutationComponents.delete)}
                {children(mutatorArg)}
              </Fragment>
            );
          }}
        </Mutator>
      </Fragment>
    );
  }
}


CrudMutator.propTypes = {
  document: PropTypes.object,
  collection: PropTypes.object.isRequired,
  fragmentName: PropTypes.string,
  children: PropTypes.func.isRequired,
  renderCreateButton: PropTypes.func,
  renderUpdateButton: PropTypes.func,
  renderDeleteButton: PropTypes.func.isRequired,
  renderSaveButton: PropTypes.func,
  onMutationError: PropTypes.func,
  onDeleteSuccess: PropTypes.func,
  onSaveSuccess: PropTypes.func,
  onUpdateSuccess: PropTypes.func,
  onCreateSuccess: PropTypes.func,
  onMutationSuccess: PropTypes.func,
  fields: PropTypes.array.isRequired,
  expectedRequestTime: PropTypes.number,
  renderDeleteConfirmTitle: PropTypes.func,
  renderDeleteConfirmContent: PropTypes.func,
  fullScreen: PropTypes.bool.isRequired,
  classes: PropTypes.object.isRequired,
};
CrudMutator.defaultProps = {
  document: undefined,
  fragmentName: 'default',
  onMutationError: null,
  onMutationSuccess: null,
  expectedRequestTime: 500,
  renderSaveButton: null,
  renderUpdateButton: null,
  renderCreateButton: null,
  onSaveSuccess: null,
  onDeleteSuccess: null,
  onUpdateSuccess: null,
  onCreateSuccess: null,
  renderDeleteConfirmTitle: (doc, classes, Icon) => <Fragment><Icon />Confirm Delete</Fragment>,
  renderDeleteConfirmContent: doc => 'Are you sure you want to delete this?',
};

const EnhancedCrudMutator = compose(
  withMobileDialog(),
  withStyles(styles),
)(CrudMutator);

export { EnhancedCrudMutator as CrudMutator };
