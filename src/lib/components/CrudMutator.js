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
    const { collection, fragmentName } = props;

    const buildOperation = op => ({
      mutationQuery: buildMutation(op, collection, fragmentName),
      renderButton: props[`render${camelToPascal(op)}Button`],
      handleClick: this[`handle${camelToPascal(op)}Doc`],
    });

    const operations = {
      create: buildOperation('create'),
      update: buildOperation('update'),
      delete: buildOperation('delete'),
    };

    return operations;
  }

  handleCreateDoc = async (mutate, { prepareToSaveDoc, startMutation }, result) => {
    const doc = await prepareToSaveDoc();
    if(!doc) return; // must have failed validation
    console.log('Starting mutation: ', doc);
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
  renderCreateButton: PropTypes.func.isRequired,
  renderUpdateButton: PropTypes.func.isRequired,
  renderDeleteButton: PropTypes.func.isRequired,
  onMutationError: PropTypes.func,
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
};

export { CrudMutator };
