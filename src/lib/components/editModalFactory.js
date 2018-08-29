import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Modal from '@material-ui/core/Modal';
import { compose } from 'react-apollo';
import SaveIcon from '@material-ui/icons/Save';
import DeleteIcon from '@material-ui/icons/Delete';
import CancelIcon from '@material-ui/icons/Cancel';
import EditIcon from '@material-ui/icons/Edit';
import { withStyles } from '@material-ui/core/styles';

import { crudModalHelper } from '../HOCs'; // eslint-disable-line import/no-extraneous-dependencies

function editModalFactory(collection, styles) {
  styles = styles || (theme => ({
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
  }));

  class EditModalWithoutHOCs extends Component {
    renderSaveButton = saveDoc => (
      <Button onClick={saveDoc} variant="contained" color="primary">
        <SaveIcon />Save
      </Button>
    )

    renderCancelButton = handleClose => (
      <Button onClick={handleClose} variant="contained" color="secondary">
        <CancelIcon />Cancel
      </Button>
    )

    renderDeleteButton = deleteDoc => (
      <Button onClick={deleteDoc} variant="contained" color="secondary">
        <DeleteIcon />Delete
      </Button>
    )

    renderTrigger = handleOpen => (
      <Button onClick={handleOpen} variant="contained" color="secondary">
        <EditIcon />Edit
      </Button>
    )

    renderTitle = () => (
      <Typography variant="title" id="modal-title">
        {this.props.title}
      </Typography>
    )

    renderErrors = errors => errors.map(error => <div key={error}>Error: {error}</div>)

    renderContainer = (renderFuncs, props) => {
      const { fieldProps, classes, globalErrors } = props;
      const buttonRenderFuncs = {
        renderSaveButton: renderFuncs.renderSaveButton,
        renderDeleteButton: renderFuncs.renderDeleteButton,
        renderCancelButton: renderFuncs.renderCancelButton,
      };

      return (
        <div className={classes.modalContainer}>
          {renderFuncs.renderTitle()}
          {renderFuncs.renderErrors(globalErrors)}
          {renderFuncs.renderForm(fieldProps)}
          {renderFuncs.renderButtons(buttonRenderFuncs, props)}

        </div>
      );
    }

    renderButtons = (renderFuncs, props) => {
      const { saveDoc, deleteDoc } = props;

      return (
        <div className="buttons">
          {renderFuncs.renderSaveButton(saveDoc)}
          {renderFuncs.renderDeleteButton(deleteDoc)}
          {renderFuncs.renderCancelButton(deleteDoc)}
        </div>
      );
    }

    render() {
      const { modalOpen, handleClose, handleOpen } = this.props;
      const renderContainer = this.props.renderContainer || this.renderContainer;
      const renderTrigger = this.props.renderTrigger || this.renderTrigger;

      const renderFuncs = {
        renderForm: this.props.renderForm || this.renderForm,
        renderButtons: this.props.renderButtons || this.renderButtons,
        renderSaveButton: this.props.renderSaveButton || this.renderSaveButton,
        renderDeleteButton: this.props.renderDeleteButton || this.renderDeleteButton,
        renderCancelButton: this.props.renderCancelButton || this.renderCancelButton,
        renderTitle: this.props.renderTitle || this.renderTitle,
        renderErrors: this.props.renderErrors || this.renderErrors,
      };

      return (
        <div>
          {renderTrigger(handleOpen)}

          <Modal open={modalOpen} onClose={handleClose}>
            {renderContainer(renderFuncs, this.props)}
          </Modal>
        </div>
      );
    }
  }
  EditModalWithoutHOCs.propTypes = {
    modalOpen: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired,
    handleOpen: PropTypes.func.isRequired,
    fieldProps: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    saveDoc: PropTypes.func.isRequired,
    deleteDoc: PropTypes.func.isRequired,
    globalErrors: PropTypes.array.isRequired,
    renderForm: PropTypes.func.isRequired,
    renderTrigger: PropTypes.func,
    renderContainer: PropTypes.func,
    renderButtons: PropTypes.func,
    renderSaveButton: PropTypes.func,
    renderDeleteButton: PropTypes.func,
    renderCancelButton: PropTypes.func,
    renderTitle: PropTypes.func,
    renderErrors: PropTypes.func,
    title: PropTypes.string,
  };
  EditModalWithoutHOCs.defaultProps = {
    renderTrigger: null,
    renderContainer: null,
    renderButtons: null,
    renderSaveButton: null,
    renderDeleteButton: null,
    renderCancelButton: null,
    renderTitle: null,
    renderErrors: null,
    title: 'Edit',
  };

  const EditModal = compose(
    withStyles(styles),
    crudModalHelper({ collection }),
  )(EditModalWithoutHOCs);

  return EditModal;
}

export { editModalFactory };
