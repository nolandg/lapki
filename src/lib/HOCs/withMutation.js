import React, { Component } from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import PropTypes from 'prop-types';
import deepSet from 'lodash.set';
import qatch from 'await-to-js';
import isEqual from 'lodash.isequal';
import queryManager from '../utils/queryManager';

function withMutation(query, graphqlOptions) {
  return function withMutationInner(WrappedComponent) {
    // Example field:
    //   {
    //     name: 'title',
    //     value: 'My Title',
    //     error: 'Too short',
    //   }
    const getInitialFields = (props) => {
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
    };

    class withMutationClass extends Component {
      callbacks = {
        onMutationSuccess: null,
        onMutationError: null,
      }

      constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
      }

      getInitialState = props => ({
        fields: getInitialFields(props),
        firstSaveAttempted: false,
      })

      componentDidUpdate = (prevProps) => {
        if(!isEqual(prevProps.document, this.props.document)) {
          this.setState(this.getInitialState(this.props));
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

        this.mutate(castDoc, 'update');
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
        const { mutate } = this.props;
        const isNew = this.isNew();
        if((operation !== 'create') && isNew) throw new Error(`Cannot "${operation}" on new document.`);
        if((operation === 'create') && !isNew) throw new Error('Cannot create a non-new document.');

        const data = { ...doc, id: undefined };

        mutate({
          variables: {
            data,
            where: { id: doc.id },
          },
        })
          .then(({ responseDoc }) => {
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
      mutate: PropTypes.func.isRequired,
    };
    withMutationClass.defaultProps = {
      document: undefined,
    };

    const defaultOptions = {
      errorPolicy: 'none',
    };
    const options = { ...defaultOptions, ...graphqlOptions };
    const config = {
      options,
    };

    const query2 = gql`
      mutation updatePost($data: PostUpdateInput!, $where: PostWhereUniqueInput!){
        updatePost(data: $data, where: $where) {
          id
          title
          body
        },
      }
    `;

    return graphql(query2, config)(withMutationClass);
  };
}


export { withMutation };
