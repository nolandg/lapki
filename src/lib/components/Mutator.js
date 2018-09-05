import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import PropTypes from 'prop-types';
import _ from 'lodash';
import qatch from 'await-to-js';
import gqlError from '../utils/gqlError';

class Mutator extends Component {
  static registerQuery(queryName) {
    Mutator.queryRegistry.push(queryName);
  }

  constructor(props) {
    super(props);
    this.state = this.buildInitialState(props);
  }

  buildInitialFields = ({ document, collection, fields: fieldsToInclude, defaultValues }) => {
    const { schema } = collection;
    const fields = {};

    fieldsToInclude.forEach((fieldName) => {
      const schemaField = schema.fields[fieldName];

      // Firs try to get initial value from document
      let value = document ? document[fieldName] : undefined;
      if(value === undefined) {
        // No document available or this field isn't in the document

        // First try a default value from passed in defaultValues
        // otherwise fallback to schema default
        value = _.get(defaultValues, fieldName, schemaField.default());
      }

      _.set(fields, fieldName, {
        name: fieldName,
        value,
        error: null,
        touched: false,
      });
    });

    return fields;
  };

  buildInitialState = props => ({
    fields: this.buildInitialFields(props),
    globalErrors: [],
    firstSaveAttempted: false,
    loading: false,
    expectedProgress: 0,
  })

  componentDidUpdate = (prevProps) => {
    if(!_.isEqual(prevProps.document, this.props.document)) {
      this.setState(this.buildInitialState(this.props));
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
    const doc = this.assembleDoc();
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

  assembleDoc = () => {
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

  prepareToSaveDoc = async ({ assembleDoc = this.assembleDoc, validateDoc = this.validateDoc } = {}) => {
    // assembleDoc = assembleDoc || this.assembleDoc;
    // validateDoc = validateDoc || this.validateDoc;

    this.setState({ firstSaveAttempted: true });
    this.clearErrors();

    const doc = assembleDoc();
    const castDoc = await validateDoc(doc);

    return castDoc;
  }

  startMutation = () => {
    this.setState({ loading: true, expectedProgress: 0 });
    const intervalTime = 50;
    const step = 100 / (this.props.expectedRequestTime / intervalTime);
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
    const { onMutationSuccess } = this.props;
    clearInterval(this.expectedProgressInterval);
    clearTimeout(this.onMutationsSuccessTimeout);
    if(onMutationSuccess && this.callMutationSuccess) this.callMutationSuccess();
  }

  handleMutationSuccess = (result) => {
    const { onMutationSuccess } = this.props;

    this.finishMutation();
    if(onMutationSuccess) {
      this.callMutationSuccess = () => onMutationSuccess(result);
      this.onMutationsSuccessTimeout = setTimeout(this.callMutationSuccess, 1000);
    }
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

  render() {
    const isNew = this.isNew();
    const { children, operations } = this.props;
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
      refetchQueries: result => Mutator.queryRegistry,
    };

    const handleClickFuncs = {
      assembleDoc: this.assembleDoc,
      validateDoc: this.validateDoc,
      prepareToSaveDoc: this.prepareToSaveDoc,
      startMutation: this.startMutation,
      finishMutation: this.finishMutation,
      clearErrors: this.clearErrors,
    };

    const mutationComponents = _.mapValues(operations, op => (
      <Mutation
        mutation={op.mutationQuery}
        children={(mutate, result) => op.renderButton(() => op.handleClick(mutate, handleClickFuncs, result), loading, result)}
        {...commonMutationProps}
      />
    ));


    return children({ fieldProps, errors, globalErrors, mutationComponents, isNew, loading, expectedProgress });
  }
}

Mutator.propTypes = {
  document: PropTypes.object,
  collection: PropTypes.object.isRequired,
  fragmentName: PropTypes.string,
  children: PropTypes.func.isRequired,
  onMutationError: PropTypes.func,
  onMutationSuccess: PropTypes.func,
  fields: PropTypes.array.isRequired,
  expectedRequestTime: PropTypes.number,
  operations: PropTypes.object.isRequired,
};
Mutator.defaultProps = {
  document: undefined,
  fragmentName: 'default',
  onMutationError: null,
  onMutationSuccess: null,
  expectedRequestTime: 500,
};

Mutator.queryRegistry = [];

export { Mutator };
