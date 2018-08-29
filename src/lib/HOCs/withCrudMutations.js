import React, { Component } from 'react';
import { graphql, compose } from 'react-apollo';
import PropTypes from 'prop-types';
import _ from 'lodash';
import qatch from 'await-to-js';
import gqlError from '../utils/gqlError';
import queryManager from '../utils/queryManager';
import generateMutation from '../utils/generateMutation';
import { camelToPascal } from '../utils/stringUtils';

// Example field:
//   {
//     name: 'title',
//     value: 'My Title',
//     error: 'Too short',
//   }
const generateInitialFields = (props, collection) => {
  const { document } = props;
  const { schema } = collection;
  const fields = {};

  Object.keys(schema.fields).forEach((fieldName) => {
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

function withCrudMutations(options) {
  const { collection, fragmentName, graphqlOptions } = options;

  return function withCrudMutationsInner(WrappedComponent) {
    class withCrudMutationsClass extends Component {
      callbacks = {
        onMutationSuccess: null,
        onMutationError: null,
      }

      constructor(props) {
        super(props);
        this.state = this.generateInitialState(props);
      }

      generateInitialState = props => ({
        fields: generateInitialFields(props, collection),
        globalErrors: [],
        firstSaveAttempted: false,
      })

      componentDidUpdate = (prevProps) => {
        if(!_.isEqual(prevProps.document, this.props.document)) {
          this.setState(this.generateInitialState(this.props));
        }
      }

      isNew = () => {
        const { document } = this.props;
        if(document && (document.id || document.id)) return false;
        return true;
      }

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
            // _.set(state.fields, `${name}.name`, name);
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
        const { schema } = collection;
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

      saveDoc = async () => {
        this.setState({ firstSaveAttempted: true });
        this.clearErrors();

        const doc = this.assembleDocument();
        const castDoc = await this.validateDoc(doc);
        if(!castDoc) {
          return;
        }

        this.mutate(castDoc, this.isNew() ? 'create' : 'update');
      }

      deleteDoc = async () => {
        this.clearErrors();
        const id = _.get(this.props, 'document.id');
        if(!id) throw Error('Cannot delete a document without id.');
        this.mutate({ id }, 'delete');
      }

      handleMutationSuccess = (doc) => {
        console.log('Mutation successful');
        queryManager.refetchQueries();
        if(this.callbacks.onMutationSuccess) this.callbacks.onMutationSuccess(doc);
      }

      handleMutationError = (error) => {
        console.error('Mutation Error: ', error);

        error = gqlError(error);
        this.setGlobalError(error.message);

        if(this.callbacks.onMutationError) this.callbacks.onMutationError(error);
      }

      mutate = (doc, operation) => {
        const isNew = this.isNew();
        if((operation !== 'create') && isNew) throw new Error(`Cannot "${operation}" on new document.`);
        if((operation === 'create') && !isNew) throw new Error('Cannot create a non-new document.');

        const mutateFunc = this.props[`${operation}Mutation`];
        const pascalType = camelToPascal(collection.type);

        // Strip off props we don't need or haven't changed to make data object
        const data = _.pickBy(doc, (value, fieldName) => this.state.fields[fieldName].touched);

        mutateFunc({
          variables: {
            data: operation !== 'delete' ? data : undefined,
            where: { id: doc.id },
          },
        })
          .then((response) => {
            const returnedDoc = response.data[`${operation}${pascalType}`];
            this.handleMutationSuccess(returnedDoc);
          })
          .catch((error) => {
            this.handleMutationError(error);
          });
      }

      registerCallbacks = (callbacks) => {
        this.callbacks = { ...this.callbacks, ...callbacks };
      }

      render() {
        const { ...rest } = this.props;
        const errors = this.extractErrorsFromFields();
        const { globalErrors } = this.state;
        const fieldProps = {
          onChange: this.handleFieldValueChange,
          fields: this.state.fields,
        };

        return (
          <WrappedComponent
            saveDoc={this.saveDoc}
            deleteDoc={this.deleteDoc}
            fieldProps={fieldProps}
            errors={errors}
            globalErrors={globalErrors}
            registerCallbacks={this.registerCallbacks}
            {...rest}
          />
        );
      }
    }

    withCrudMutationsClass.propTypes = {
      document: PropTypes.object,
      createMutation: PropTypes.func.isRequired,
      updateMutation: PropTypes.func.isRequired,
      deleteMutation: PropTypes.func.isRequired,
    };
    withCrudMutationsClass.defaultProps = {
      document: undefined,
    };

    const defaultConfigOptions = {
      errorPolicy: 'none',
    };
    const configOptions = { ...defaultConfigOptions, ...graphqlOptions };
    const config = {
      configOptions,
    };

    const createMutation = generateMutation('create', collection, fragmentName);
    const updateMutation = generateMutation('update', collection, fragmentName);
    const deleteMutation = generateMutation('delete', collection, fragmentName);

    return compose(
      graphql(createMutation, { ...config, name: 'createMutation' }),
      graphql(updateMutation, { ...config, name: 'updateMutation' }),
      graphql(deleteMutation, { ...config, name: 'deleteMutation' }),
    )(withCrudMutationsClass);
  };
}


export { withCrudMutations };
