import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Button from '@material-ui/core/Button';
import qatch from 'await-to-js';
import generateMutation from '../utils/generateMutation';
import gqlError from '../utils/gqlError';
// import { camelToPascal } from '../utils/stringUtils';

const EXPECTED_REQUESTED_TIME = 500;

// Example field:
//   {
//     name: 'title',
//     value: 'My Title',
//     error: 'Too short',
//   }
const generateInitialFields = ({ document, collection, fields: fieldsToInclude }) => {
  const { schema } = collection;
  const fields = {};
  if(!fieldsToInclude.includes('id')) fieldsToInclude.push('id');

  fieldsToInclude.forEach((fieldName) => {
    const schemaField = schema.fields[fieldName];

    // Firs try to get initial value from document
    let value = document ? document[fieldName] : undefined;
    if(value === undefined) {
      // No document available or this field isn't in the document
      // Get a default value from schema
      value = schemaField.default();
    }

    fields[fieldName] = {
      name: fieldName,
      value,
      error: null,
      touched: false,
    };
  });

  return fields;
};

class CrudMutator extends Component {
  static registerQuery(queryName) {
    CrudMutator.queryRegistry.push(queryName);
  }

  constructor(props) {
    super(props);
    const { collection, fragmentName } = props;
    this.state = this.generateInitialState(props);
    // this.state.expectedProgress = 0;

    this.createMutation = generateMutation('create', collection, fragmentName);
    this.updateMutation = generateMutation('update', collection, fragmentName);
    this.deleteMutation = generateMutation('delete', collection, fragmentName);
  }

  generateInitialState = props => ({
    fields: generateInitialFields(props),
    globalErrors: [],
    firstSaveAttempted: false,
    loading: false,
    expectedProgress: 0,
  })

  componentDidUpdate = (prevProps) => {
    if(!_.isEqual(prevProps.document, this.props.document)) {
      this.setState(this.generateInitialState(this.props));
    }
  }

  isNew = () => !_.get(this.props, 'document.id')

  getFields = () => {
    const fields = [];
    Object.keys(this.state.fields).forEach((name) => {
      const field = this.state.fields[name];
      fields.push(field);
    });
    return fields;
  }

  setFieldValue = (name, value, cb) => {
    this.setState((state) => {
      _.set(state.fields, `${name}.value`, value);
      _.set(state.fields, `${name}.touched`, true);
      return state;
    }, cb);
  }

  setFieldError = (name, error, cb) => {
    this.setState((state) => {
      if(name) {
        _.set(state.fields, `${name}.error`, error);
      }
      return state;
    }, cb);
  }

  setGlobalError = (error, cb) => {
    this.setState((state) => {
      state.globalErrors.push(error);
      return state;
    }, cb);
  }

  handleFieldValueChange = (e, name, value) => {
    this.setFieldValue(name, value, () => {
      if(this.state.firstSaveAttempted) this.recheckForErrors();
    });
  }

  recheckForErrors = () => {
    this.clearErrors();
    const doc = this.assembleDocument();
    this.validateDoc(doc);
  }

  validateDoc = async (doc, setErrors = true) => {
    const { schema } = this.props.collection;
    const [error, castDoc] = await qatch(schema.validate(doc, { abortEarly: false }));

    if(error) {
      if(setErrors) {
        error.inner.forEach(({ message, path }) => {
          this.setFieldError(path, message);
        });
      }
      return false;
    }

    return castDoc;
  }

  assembleDocument = () => {
    const doc = {};
    this.getFields().forEach((field) => {
      _.set(doc, field.name, field.value);
    });

    return doc;
  }

  clearErrors = () => {
    this.getFields().forEach((field) => {
      this.setFieldError(field.name, null);
    });
    this.setState({ globalErrors: [] });
  }

  extractErrorsFromFields = () => {
    const errors = [];
    this.getFields().forEach((field) => {
      if(field.error) errors.push(field.error);
    });
    return errors;
  }

  prepareToSaveDoc = async () => {
    this.setState({ firstSaveAttempted: true });
    this.clearErrors();

    const doc = this.assembleDocument();
    const castDoc = await this.validateDoc(doc);

    return castDoc;
  }

  startMutation = () => {
    this.setState({ loading: true, expectedProgress: 0 });
    const intervalTime = 50;
    const step = 100 / (EXPECTED_REQUESTED_TIME / intervalTime);
    this.expectedProgressInterval = setInterval(
      () => this.setState(state => ({ expectedProgress: state.expectedProgress + step })),
      intervalTime,
    );
  }

  finishMutation = () => {
    this.setState({ loading: false, expectedProgress: 100 });
    setTimeout(() => {
      // if(!this.state.loading) this.setState({ expectedProgress: 0 });
    }, 1000);
    clearInterval(this.expectedProgressInterval);
  }

  componentWillUnmount = () => {
    clearInterval(this.expectedProgressInterval);
  }

  handleMutationSuccess = () => {
    const { onMutationSuccess } = this.props;

    this.finishMutation();
    if(onMutationSuccess) setTimeout(onMutationSuccess, 1000);
    console.log('Mutation successful');
  }

  handleMutationError = (error) => {
    const { onMutationError } = this.props;
    this.finishMutation();

    if(onMutationError) onMutationError();

    error = gqlError(error);
    this.setGlobalError(error.message);
    console.error('Mutation Error: ', error);
  }

  handleCreateDoc = async (mutate, result) => {
    const doc = await this.prepareToSaveDoc();
    if(!doc) return; // must have failed validation

    this.startMutation();
    mutate({
      variables: {
        data: doc,
      },
    });
  }

  handleUpdateDoc = async (mutate, result) => {
    const doc = await this.prepareToSaveDoc();
    if(!doc) return; // must have failed validation
    const id = doc.id;
    if(!id) throw Error('Cannot update a document without id.');

    // We can't send id for updates
    delete doc.id;

    this.startMutation();
    mutate({
      variables: {
        where: { id },
        data: doc,
      },
    });
  }

  handleDeleteDoc = async (mutate, result) => {
    this.clearErrors();
    const id = _.get(this.props, 'document.id');
    if(!id) throw Error('Cannot delete a document without id.');

    this.startMutation();
    mutate({
      variables: {
        where: { id },
      },
    });
  }

  renderCreateButton = (handleCreateDoc, loading, result) => (
    <Button disabled={loading} onClick={handleCreateDoc}>
        Create
    </Button>
  )

  renderUpdateButton = (handleUpdateDoc, loading, result) => (
    <Button disabled={loading} onClick={handleUpdateDoc}>
        Update
    </Button>
  )

  renderDeleteButton = (handleDeleteDoc, loading, result) => (
    <Button disabled={loading} onClick={handleDeleteDoc}>
        Delete
    </Button>
  )

  render() {
    const isNew = this.isNew();
    const { children } = this.props;
    const renderCreateButton = this.props.renderCreateButton || this.renderCreateButton;
    const renderUpdateButton = this.props.renderUpdateButton || this.renderUpdateButton;
    const renderDeleteButton = this.props.renderDeleteButton || this.renderDeleteButton;
    const errors = this.extractErrorsFromFields();
    const { globalErrors, loading, expectedProgress } = this.state;
    const fieldProps = {
      onChange: this.handleFieldValueChange,
      fields: this.state.fields,
      loading,
    };

    const commonMutationProps = {
      onCompleted: this.handleMutationSuccess,
      onError: this.handleMutationError,
      refetchQueries: result => CrudMutator.queryRegistry,
    };

    const crudMutationComponents = {
      createComponent: <Mutation
        mutation={this.createMutation}
        children={(mutate, result) => renderCreateButton(() => this.handleCreateDoc(mutate, result), loading, result)}
        {...commonMutationProps}
      />,
      updateComponent: <Mutation
        mutation={this.updateMutation}
        children={(mutate, result) => renderUpdateButton(() => this.handleUpdateDoc(mutate, result), loading, result)}
        {...commonMutationProps}
      />,
      deleteComponent: <Mutation
        mutation={this.deleteMutation}
        children={(mutate, result) => renderDeleteButton(() => this.handleDeleteDoc(mutate, result), loading, result)}
        {...commonMutationProps}
      />,
    };

    return children({ fieldProps, errors, globalErrors, crudMutationComponents, isNew, loading, expectedProgress });
  }
}

CrudMutator.propTypes = {
  document: PropTypes.object,
  collection: PropTypes.object.isRequired,
  fragmentName: PropTypes.string,
  children: PropTypes.func.isRequired,
  renderCreateButton: PropTypes.func,
  renderUpdateButton: PropTypes.func,
  renderDeleteButton: PropTypes.func,
  onMutationError: PropTypes.func,
  onMutationSuccess: PropTypes.func,
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  fields: PropTypes.array.isRequired,
};
CrudMutator.defaultProps = {
  document: undefined,
  fragmentName: 'default',
  renderCreateButton: null,
  renderUpdateButton: null,
  renderDeleteButton: null,
  onMutationError: null,
  onMutationSuccess: null,
  as: 'div',
};

CrudMutator.queryRegistry = [];

export { CrudMutator };
