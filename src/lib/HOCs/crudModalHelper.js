import React from 'react';
import PropTypes from 'prop-types';

import { withCrudMutations } from './withCrudMutations';

function crudModalHelperWithoutHOCs(WrappedComponent) {
  class withMutationModalHelperClass extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        modalOpen: false,
      };

      props.registerCallbacks({
        onMutationSuccess: this.handleMutationSuccess,
      });
    }

    handleOpen = () => {
      this.setState({ modalOpen: true });
    };

    handleClose = () => {
      this.setState({ modalOpen: false });
    };

    handleMutationSuccess = () => {
      this.handleClose();
    };

    render() {
      const { ...rest } = this.props;

      return (
        <WrappedComponent
          handleOpen={this.handleOpen}
          handleClose={this.handleClose}
          modalOpen={this.state.modalOpen}
          {...rest}
        />
      );
    }
  }
  withMutationModalHelperClass.propTypes = {
    document: PropTypes.object,
    collection: PropTypes.object.isRequired,
    registerCallbacks: PropTypes.func.isRequired,
  };
  withMutationModalHelperClass.defaultProps = {
    document: undefined,
  };

  return withMutationModalHelperClass;
}

// eslint-disable-next-line arrow-body-style
const crudModalHelper = (options) => {
  return WrappedComponent => withCrudMutations(options)(crudModalHelperWithoutHOCs(WrappedComponent));
};

export { crudModalHelper };
