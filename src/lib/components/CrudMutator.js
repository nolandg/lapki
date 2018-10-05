import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import buildMutation from '../utils/buildMutation';
import { Mutator } from './Mutator';
import { camelToPascal } from '../utils/stringUtils';


class CrudMutator extends Component {
  constructor(props) {
    super(props);
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

  handleCreateDoc = async (mutate, { prepareToSaveDoc, startMutation }, result) => {
    const doc = await prepareToSaveDoc();
    if(!doc) return; // must have failed validation
    startMutation();
    mutate({
      variables: {
        data: doc,
      },
    });
  }

  handleUpdateDoc = async (mutate, { prepareToSaveDoc, startMutation }, result) => {
    const doc = await prepareToSaveDoc();
    if(!doc) return; // must have failed validation
    const id = _.get(this.props, 'document.id');
    if(!id) throw Error('Cannot update a document without id.');

    // We can't send id for updates
    delete doc.id;

    startMutation();
    mutate({
      variables: {
        where: { id },
        data: doc,
      },
    });
  }

  handleDeleteDoc = async (mutate, { startMutation, clearErrors }, result) => {
    clearErrors();
    const id = _.get(this.props, 'document.id');
    if(!id) throw Error('Cannot delete a document without id.');

    startMutation();
    mutate({
      variables: {
        where: { id },
      },
    });
  }

  render() {
    const { fields, ...rest } = this.props;

    return (
      <Mutator operations={this.operations} fields={fields} {...rest} />
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
};

export { CrudMutator };
