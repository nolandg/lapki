import React, { Component, Fragment } from 'react';
import { Mutation, withApollo } from 'react-apollo';
import PropTypes from 'prop-types';
import { Prompt } from 'react-router';
import _ from 'lodash';
import qatch from 'await-to-js';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';

import gqlError from '../utils/gqlError';
import { AuthenticationModal } from '../auth/AuthenticationModal';
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
    this.saveFieldsSnapshot(this.state.fields);
  }

  getFormValueFromDoc = (fieldName) => {
    const { document, collection } = this.props;
    if(!document) return undefined;

    const defaultTransformFunc = () => document[fieldName] || undefined;
    const transform = _.get(collection, `transforms.${fieldName}.docValueToFormValue`) || defaultTransformFunc;

    return transform(document[fieldName], fieldName, document);
  }

  buildInitialFields = ({ document, collection, fields: fieldsToInclude, defaultValues, fixedValues }) => {
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

      // Override all of the above with a fixed value if provided
      if(fixedValues && fixedValues[fieldName]) value = fixedValues[fieldName];

      _.set(fields, fieldName, {
        name: fieldName,
        value,
        error: null,
      });
    });

    return fields;
  };

  saveFieldsSnapshot = (fields) => {
    this.fieldsSnapshot = JSON.parse(JSON.stringify(fields || this.state.fields));
  }

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
    this.validateDoc();
  }

  validateDoc = async (setErrors = true) => {
    let doc = this.assembleDoc('preValidation');
    const { schema } = this.props.collection;
    const [error] = await qatch(schema.validate(doc, { abortEarly: false }));

    if(error) {
      if(setErrors) {
        error.inner.forEach(({ message, path }) => {
          this.setFieldError(path, message);
        });
      }
      console.warn('Errors validating document: ', error);
      return false;
    }

    doc = this.assembleDoc('postValidation');

    return doc;
  }

  assembleDoc = (stage) => {
    if(stage !== 'preValidation' && stage !== 'postValidation') throw new Error('assembleDoc stage must be either "preValidation" or "postValidation".');

    const { collection, document } = this.props;
    const doc = {};
    const fields = this.getFields();

    fields.forEach((field) => {
      const defaultTransform = () => field.value;
      const transform = _.get(collection, `transforms.${field.name}.formValueToMutationArg.${stage}`) || defaultTransform;
      const value = transform(field.value, field.name, fields, document);
      _.set(doc, field.name, value);
    });

    if(this.props.assembleDoc) return this.props.assembleDoc(stage, doc, fields);
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

  prepareToSaveDoc = async ({ assembleDoc = this.assembleDoc } = {}) => {
    if(this.props.prepareToSaveDoc) return this.props.prepareToSaveDoc({ assembleDoc, validateDoc: this.validateDoc });

    if(!this.state.firstSaveAttempted) this.setState({ firstSaveAttempted: true });
    this.clearErrors();

    const doc = await this.validateDoc();

    return doc;
  }

  signalStartOfMutation = () => {
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

  checkIfTouched = () => {
    // short circut if last pass through here we determined in was touched
    // and nobody has reset this.fieldsSnapshot in the meantime
    if(!this.fieldsSnapshot) return true;

    const touched = JSON.stringify(this.state.fields) !== JSON.stringify(this.fieldsSnapshot);

    if(touched) {
      // Save postive results so that next time we don't have to deep compare the objects
      // this.fieldsSnapshot will be reset to non-null after a mutation or something
      this.fieldsSnapshot = null;
    }

    return touched;
  }

  componentDidMount() {
    window.onbeforeunload = () => {
      const { confirmLeavePage } = this.props;

      if(confirmLeavePage && this.checkIfTouched()) {
        return 'You have unsaved changes, are you sure you want to leave?';
      }
      return undefined;
    };
  }

  componentWillUnmount = () => {
    this.closeSnackbar();
    clearInterval(this.expectedProgressInterval);
    clearTimeout(this.onMutationsSuccessTimeout);
    clearTimeout(this.resetStoreTimeout);
    if(this.callMutationSuccess) this.callMutationSuccess();
    window.onbeforeunload = null;
  }

  handleMutationSuccess = (data, cb) => {
    const { onMutationSuccess, client, clearAfterSuccess } = this.props;

    if(resetStoreEachOnEveryMutation) {
      this.resetStoreTimeout = window.setTimeout(client.resetStore, 50);
    }

    if(clearAfterSuccess) {
      this.setState(this.buildInitialState(this.props));
    }

    this.saveFieldsSnapshot();

    this.finishMutation();
    this.callMutationSuccess = () => {
      if(onMutationSuccess) onMutationSuccess(data);
      if(cb) cb();
    };
    this.onMutationsSuccessTimeout = setTimeout(this.callMutationSuccess, 500);


    this.openSnackbar({ data, hackToGetDoc: this.assembleDoc('preValidation') });

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
      prepareToSaveDoc: this.prepareToSaveDoc,
      finishMutation: this.finishMutation,
      clearErrors: this.clearErrors,
    };

    const handleClick = () => {
      op.handleClick((...mutationArgs) => {
        this.signalStartOfMutation();
        mutate(...mutationArgs);
      }, handleClickFuncs, result);
    };
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

  getMutationOperationName = (mutation) => {
    if(!mutation || !mutation.definitions) throw new Error('Must pass a graphql mutation AST to getMutationOperationName()');
    const op = mutation.definitions.find(d => d.kind === 'OperationDefinition');
    if(!op) throw new Error('No operation definition found in graphql AST.');
    return op.name.value;
  }

  buildMutationComponent = op => (
    <Mutation
      mutation={op.mutationQuery}
      children={this.buildMutationRenderProp(op)}
      onCompleted={(data) => {
        const doc = data[this.getMutationOperationName(op.mutationQuery)];
        this.handleMutationSuccess(data, () => {
          if(op.onSuccess) op.onSuccess(doc);
        });
      }}
      onError={(error) => { this.handleMutationError(error); if(op.onError) op.onError(error); }}
      refetchQueries={(result) => {
        if(resetStoreEachOnEveryMutation) {
          return [];
        }
        return Mutator.queryRegistry;
      }}
    />
  );

  render() {
    const isNew = this.isNew();
    const { children, operations, confirmLeavePage } = this.props;
    const errors = this.extractErrorsFromFields();
    const { globalErrors, loading, expectedProgress, authModalOpen } = this.state;
    const fieldProps = {
      onChange: this.handleFieldValueChange,
      fields: this.state.fields,
      loading,
    };

    const mutationComponents = _.mapValues(operations, this.buildMutationComponent);
    // Special case for "save" operation to make it easier to collapse update and create into save
    mutationComponents.save = isNew ? mutationComponents.create : mutationComponents.update;

    return (
      <Fragment>
        {children({ fieldProps, errors, globalErrors, mutationComponents, isNew, loading, expectedProgress })}
        {this.renderSnackbars()}
        <Prompt when={confirmLeavePage && this.checkIfTouched()} message="You have unsaved changes. Are you sure you want to leave?" />
        <AuthenticationModal open={authModalOpen} onClose={() => this.setState({ authModalOpen: false })} />
      </Fragment>
    );
  }
}

Mutator.propTypes = {
  classes: PropTypes.object.isRequired,
  document: PropTypes.object,
  collection: PropTypes.object.isRequired,
  fragmentName: PropTypes.string, // eslint-disable-line
  children: PropTypes.func.isRequired,
  onMutationError: PropTypes.func,
  onMutationSuccess: PropTypes.func,
  fields: PropTypes.array, // eslint-disable-line
  expectedRequestTime: PropTypes.number,
  operations: PropTypes.object.isRequired,
  assembleDoc: PropTypes.func,
  getSuccessMessageAndAction: PropTypes.func,
  getErrorMessageAndAction: PropTypes.func,
  prepareToSaveDoc: PropTypes.func,
  getSnackbarMessageAndAction: PropTypes.func,
  client: PropTypes.object.isRequired,
  clearAfterSuccess: PropTypes.bool,
  confirmLeavePage: PropTypes.bool,
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
  prepareToSaveDoc: null,
  getSnackbarMessageAndAction: null,
  clearAfterSuccess: false,
  fields: [],
  confirmLeavePage: true,
};

Mutator.queryRegistry = [];

const EnhancedMutator = withApollo(withStyles(styles)(Mutator));

export { EnhancedMutator as Mutator };
