import React from 'react';
import PropTypes from 'prop-types';

import { withCrudMutations } from './withCrudMutations';

function crudModalHelperWithoutHOCs(WrappedComponent) {
  class crudModalHelperClass extends React.Component {
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
  crudModalHelperClass.propTypes = {
    document: PropTypes.object,
    registerCallbacks: PropTypes.func.isRequired,
  };
  crudModalHelperClass.defaultProps = {
    document: undefined,
  };

  return crudModalHelperClass;
}

// eslint-disable-next-line arrow-body-style
const crudModalHelper = (options) => {
  return WrappedComponent => withCrudMutations(options)(crudModalHelperWithoutHOCs(WrappedComponent));
};

export { crudModalHelper };
