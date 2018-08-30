import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Button from '@material-ui/core/Button';
import qatch from 'await-to-js';
import gqlError from '../utils/gqlError';
import generateMutation from '../utils/generateMutation';
// import { camelToPascal } from '../utils/stringUtils';

// Example field:
//   {
//     name: 'title',
//     value: 'My Title',
//     error: 'Too short',
//   }
const generateInitialFields = ({ document, collection }) => {
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

class CrudMutator extends Component {
  static registerQuery(queryName) {
    CrudMutator.queryRegistry.push(queryName);
  }

  constructor(props) {
    super(props);
    const { collection, fragmentName } = props;
    this.state = this.generateInitialState(props);

    this.createMutation = generateMutation('create', collection, fragmentName);
    this.updateMutation = generateMutation('update', collection, fragmentName);
    this.deleteMutation = generateMutation('delete', collection, fragmentName);
  }

  generateInitialState = props => ({
    fields: generateInitialFields(props),
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

  deleteDoc = async () => {
    this.clearErrors();
    const id = _.get(this.props, 'document.id');
    if(!id) throw Error('Cannot delete a document without id.');
    this.mutate({ id }, 'delete');
  }

  handleMutationSuccess = () => {
    console.log('Mutation successful');
  }

  handleMutationError = (error) => {
    console.error('Mutation Error: ', error);

    error = gqlError(error);
    this.setGlobalError(error.message);
  }

  renderButtons = ({ create }) => (
    <div>
      {create}
    </div>
  )

  handleCreateDoc = async (mutate) => {
    const doc = await this.prepareToSaveDoc();
    if(!doc) return;

    mutate({
      variables: {
        data: doc,
      },
    });
  }

  renderCreateButton = (mutate, result) => {
    const { loading } = result;
    return (
      <Button disabled={loading} onClick={() => { this.handleCreateDoc(mutate, result); }}>
        Create
      </Button>
    );
  }

  render() {
    const {
      as: As,
      renderForm,
      fragmentName,
      collection,
      renderButtons: propRenderButtons,
      renderCreateButton: propRenderCreateButton,
      ...rest
    } = this.props;
    const renderButtons = propRenderButtons || this.renderButtons;
    const renderCreateButton = this.props.renderCreateButton || this.renderCreateButton;
    const errors = this.extractErrorsFromFields();
    const { globalErrors } = this.state;
    const fieldProps = {
      onChange: this.handleFieldValueChange,
      fields: this.state.fields,
    };

    const commonMutationProps = {
      onCompleted: this.handleMutationSuccess,
      onError: this.handleMutationError,
    };

    const crudMutationComponents = {
      create: <Mutation
        mutation={this.createMutation}
        children={renderCreateButton}
        refetchQueries={result => CrudMutator.queryRegistry}
        {...commonMutationProps}
      />,
    };

    return (
      <As {...rest}>
        {renderForm({ fieldProps, errors, globalErrors })}
        {renderButtons(crudMutationComponents)}
      </As>
    );
  }
}

CrudMutator.propTypes = {
  document: PropTypes.object,
  collection: PropTypes.object.isRequired,
  renderForm: PropTypes.func.isRequired,
  fragmentName: PropTypes.string,
  renderButtons: PropTypes.func,
  renderCreateButton: PropTypes.func,
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};
CrudMutator.defaultProps = {
  document: undefined,
  fragmentName: 'default',
  renderButtons: null,
  renderCreateButton: null,
  as: 'div',
};

CrudMutator.queryRegistry = [];

export { CrudMutator };
