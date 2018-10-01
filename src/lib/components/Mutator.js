import React, { Component, Fragment } from 'react';
import { Mutation, withApollo } from 'react-apollo';
import PropTypes from 'prop-types';
import _ from 'lodash';
import qatch from 'await-to-js';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';


import gqlError from '../utils/gqlError';
import { AuthenticationModal } from '../auth';
import { Snackbar } from './Snackbar';

const resetStoreEachOnEveryMutation = true;

const styles = theme => ({
  snackbarAction: {
    color: '#FFF',
    marginBottom: theme.spacing.unit * 1,
  },
});

class Mutator extends Component {
  static registerQuery(queryName) {
    Mutator.queryRegistry.push(queryName);
  }

  constructor(props) {
    super(props);
    this.state = this.buildInitialState(props);
  }

  getFormValueFromDoc = (fieldName) => {
    const { document, mapDocValuesToFormValues } = this.props;
    if(!document) return undefined;

    const defaultMapFunc = () => document[fieldName] || undefined;
    const mapFunc = _.get(mapDocValuesToFormValues, fieldName, defaultMapFunc);

    return mapFunc(document[fieldName], document, fieldName);
  }

  buildInitialFields = ({ document, collection, fields: fieldsToInclude, defaultValues }) => {
    if(!collection) {
      throw new Error('No collection passed to <Mutator>');
    }
    const { schema } = collection;
    const fields = {};

    fieldsToInclude.forEach((fieldName) => {
      const schemaField = schema.fields[fieldName];
      if(!schemaField) {
        throw new Error(`Cannot find field "${fieldName}" in schema for type "${collection.type}"`);
      }

      // First try to get initial value from document
      let value = this.getFormValueFromDoc(fieldName);
      if(value === undefined) {
        // No document available or this field isn't in the document

        // Then try a default value from passed in defaultValues
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
    snackbar: {
      open: false,
      message: '',
      type: 'success',
    },
    authModalOpen: false,
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

  handleFieldValueChange = (name, value) => {
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
    if(this.props.validateDoc) return this.props.validateDoc(doc, setErrors);

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

    if(this.props.assembleDoc) return this.props.assembleDoc(doc);

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
    if(this.props.prepareToSaveDoc) return this.props.prepareToSaveDoc({ assembleDoc, validateDoc });

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

  handleMutationSuccess = (data) => {
    const { onMutationSuccess, client } = this.props;

    if(resetStoreEachOnEveryMutation) {
      client.resetStore();
    }

    this.finishMutation();
    if(onMutationSuccess) {
      this.callMutationSuccess = () => onMutationSuccess(data);
      this.onMutationsSuccessTimeout = setTimeout(this.callMutationSuccess, 0);
    }

    this.openSnackbar({ data, hackToGetDoc: this.assembleDoc() });

    console.log('Mutation successful');
  }

  handleMutationError = (error) => {
    const { onMutationError } = this.props;
    this.finishMutation();

    if(onMutationError) onMutationError();

    error = gqlError(error);
    this.setGlobalError(error.message);

    this.openSnackbar({ error });

    console.error('Mutation Error: ', error);
  }

  buildMutationRenderProp = op => (mutate, result) => {
    const { loading } = this.state;
    const handleClickFuncs = {
      assembleDoc: this.assembleDoc,
      validateDoc: this.validateDoc,
      prepareToSaveDoc: this.prepareToSaveDoc,
      startMutation: this.startMutation,
      finishMutation: this.finishMutation,
      clearErrors: this.clearErrors,
    };

    const handleClick = () => op.handleClick(mutate, handleClickFuncs, result);
    return op.renderButton({ handleClick, loading, result, isNew: this.isNew() });
  }

  openSnackbar = ({ data, error, hackToGetDoc }) => {
    this.setState({ snackbar: {
      open: true,
      type: error ? 'error' : 'success',
      ...this.getSnackbarMessageAndAction({ data, error, hackToGetDoc }),
    } });
  }

  closeSnackbar = (event, reason) => {
    this.setState({ snackbar: { open: false } });
  }

  getSnackbarMessageAndAction = ({ data, error, hackToGetDoc }) => {
    if(this.props.getSnackbarMessageAndAction) return this.props.getSnackbarMessageAndAction({ data, error });
    if(!error && this.props.getSuccessMessageAndAction) return this.props.getSuccessMessageAndAction({ data, hackToGetDoc });
    if(error && this.props.getErrorMessageAndAction) return this.props.getErrorMessageAndAction({ error, hackToGetDoc });

    let action;
    if(error) {
      if(error.type === 'auth') {
        action = (
          <Button
            onClick={() => {
              this.setState({ authModalOpen: true });
              this.closeSnackbar();
            }}
            className={this.props.classes.snackbarAction}
          >
          Login Now
          </Button>
        );
      }
    }

    return {
      message: error ? error.message : 'Success!',
      action,
    };
  }

  renderSnackbars = () => {
    const { snackbar: { open, message, type, action } } = this.state;

    if(open) return <Snackbar open message={message} type={type} action={action} onClose={this.closeSnackbar} />;
    return null;
  }

  render() {
    const isNew = this.isNew();
    const { children, operations } = this.props;
    const errors = this.extractErrorsFromFields();
    const { globalErrors, loading, expectedProgress, authModalOpen } = this.state;
    const fieldProps = {
      onChange: this.handleFieldValueChange,
      fields: this.state.fields,
      loading,
    };

    const commonMutationProps = {
      onCompleted: this.handleMutationSuccess,
      onError: this.handleMutationError,
      refetchQueries: (result) => {
        if(resetStoreEachOnEveryMutation) {
          return [];
        }
        return Mutator.queryRegistry;
      },
    };

    const mutationComponents = _.mapValues(operations, op => (
      <Mutation
        mutation={op.mutationQuery}
        children={this.buildMutationRenderProp(op)}
        {...commonMutationProps}
      />
    ));
    mutationComponents.save = isNew ? mutationComponents.create : mutationComponents.update;

    return (
      <Fragment>
        {children({ fieldProps, errors, globalErrors, mutationComponents, isNew, loading, expectedProgress })}
        {this.renderSnackbars()}
        <AuthenticationModal open={authModalOpen} onClose={() => this.setState({ authModalOpen: false })} />
      </Fragment>
    );
  }
}

Mutator.propTypes = {
  classes: PropTypes.object.isRequired,
  document: PropTypes.object,
  collection: PropTypes.object.isRequired,
  fragmentName: PropTypes.string,
  children: PropTypes.func.isRequired,
  onMutationError: PropTypes.func,
  onMutationSuccess: PropTypes.func,
  fields: PropTypes.array.isRequired,
  expectedRequestTime: PropTypes.number,
  operations: PropTypes.object.isRequired,
  assembleDoc: PropTypes.func,
  getSuccessMessageAndAction: PropTypes.func,
  getErrorMessageAndAction: PropTypes.func,
  mapDocValuesToFormValues: PropTypes.object,
};
Mutator.defaultProps = {
  document: undefined,
  fragmentName: 'default',
  onMutationError: null,
  onMutationSuccess: null,
  expectedRequestTime: 500,
  assembleDoc: null,
  getSuccessMessageAndAction: null,
  getErrorMessageAndAction: null,
  mapDocValuesToFormValues: null,
};

Mutator.queryRegistry = [];

Mutator = withApollo(withStyles(styles)(Mutator));

export { Mutator };
