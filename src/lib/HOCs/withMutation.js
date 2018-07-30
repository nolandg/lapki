import React, { Component } from 'react';
import PropTypes from 'prop-types';
import fetch from 'isomorphic-fetch';
import deepSet from 'lodash.set';
import qatch from 'await-to-js';
import queryManager from '../utils/queryManager';

import connectionManager from '../utils/connectionManager';

export function withMutation() {
  return function withMutationInner(WrappedComponent) {
    class withMutationClass extends Component {
      callbacks = {
        onMutationSuccess: null,
        onMutationError: null,
      }

      constructor(props) {
        super(props);
        this.state = {
          fields: this.initializeFields(props),
          firstSaveAttempted: false,
        };
      }

      isNew = () => {
        const { document } = this.props;
        if(document && (document.id || document._id)) return false;
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

      // Example field:
      //   {
      //     name: 'title',
      //     value: 'My Title',
      //     error: 'Too short',
      //   }
      initializeFields = (props) => {
        const { document, collection } = props;
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
          };
        });

        return fields;
      }

      componentDidMount = () => {
        this.setState({ firstSaveAttempted: false });
      }

      setFieldValue = (name, value, cb) => {
        this.setState((state) => {
          deepSet(state.fields, `${name}.value`, value);
          deepSet(state.fields, `${name}.name`, name);
          return state;
        }, cb);
      }

      setFieldError = (name, error, cb) => {
        this.setState((state) => {
          deepSet(state.fields, `${name}.error`, error);
          deepSet(state.fields, `${name}.name`, name);
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
        const { collection } = this.props;
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
          deepSet(doc, field.name, field.value);
        });

        return doc;
      }

      clearErrors = () => {
        this.getFields().forEach((field) => {
          this.setFieldError(field.name, null);
        });
      }

      extractErrorsFromFields = () => {
        const errors = [];
        this.getFields().forEach((field) => {
          if(field.error) errors.push(field.error);
        });
        return errors;
      }

      save = async () => {
        this.setState({ firstSaveAttempted: true });
        this.clearErrors();

        const doc = this.assembleDocument();
        const castDoc = await this.validateDoc(doc);
        if(!castDoc) {
          return;
        }

        this.mutate(castDoc, 'save');
      }

      handleMutationSuccess = (doc) => {
        console.log('Successfully saved document ');
        queryManager.refetchQueries();
        if(this.callbacks.onMutationSuccess) this.callbacks.onMutationSuccess(doc);
      }

      handleMutationError = (error) => {
        console.error('Mutation Error: ', error);
        if(this.callbacks.onMutationError) this.callbacks.onMutationError(error);
      }

      mutate = (doc, operation) => {
        const { typeName, connectionName } = this.props.collection;
        const connection = connectionManager.get(connectionName);
        const isNew = this.isNew();
        let verb;
        let uri = `${connection.uri}/${typeName}`;

        if(isNew && (operation === 'save')) {
          verb = 'POST';
        }else if(!isNew) {
          if(operation === 'save') {
            verb = 'PUT';
          }else if(operation === 'delete') {
            verb = 'DELETE';
          }else{
            throw new Error(`Invalid combination of operation and newness to mutate(). Cannot "${operation}" on existing document`);
          }
          if(doc._id) uri += `/${doc._id}`;
          else if(doc.id) uri += `/${doc.id}`;
          else throw new Error('Mising id or _id field for non-new mutation');
        }else{
          throw new Error(`Invalid combination of operation and newness to mutate(). Cannot "${operation}" on new document`);
        }

        const headers = {
          'Content-Type': 'application/json',
          ...connection.headers,
        };
        fetch(uri, {
          method: verb,
          headers,
          body: doc ? JSON.stringify(doc) : '',
        })
          .then((response) => {
            if (!response.ok) {
              throw Error(response.statusText);
            }
            return response.json();
          }, (error) => {
            console.error('Network mutation error');
            this.handleMutationError(error);
          })
          .then((responseDoc) => {
            this.handleMutationSuccess(responseDoc);
          })
          .catch((error) => {
            console.error('Mutation error caught');
            this.handleMutationError(error);
          });
      }

      registerCallbacks = (callbacks) => {
        this.callbacks = { ...this.callbacks, ...callbacks };
      }

      render() {
        const { ...rest } = this.props;
        const errors = this.extractErrorsFromFields();
        const fieldProps = {
          onChange: this.handleFieldValueChange,
          fields: this.state.fields,
        };

        return (
          <WrappedComponent
            save={this.save}
            fieldProps={fieldProps}
            errors={errors}
            registerCallbacks={this.registerCallbacks}
            {...rest}
          />
        );
      }
    }
    withMutationClass.propTypes = {
      document: PropTypes.object,
      collection: PropTypes.object.isRequired,
    };
    withMutationClass.defaultProps = {
      document: undefined,
    };

    return withMutationClass;
  };
}
