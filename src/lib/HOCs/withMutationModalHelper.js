import React from 'react';
import PropTypes from 'prop-types';

import { withMutation } from './withMutation';

function withMutationModalHelper(WrappedComponent) {
  class withMutationModalHelperClass extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        modalOpen: false,
      };

      props.registerCallbacks({
        onMutationSuccess: this.handleClose,
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
      console.log('we are done!!');
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
const withMutationModalHelperWithHOCs = (type, fragment, graphqlOptions) => {
  return WrappedComponent => withMutation(type, fragment, graphqlOptions)(withMutationModalHelper(WrappedComponent));
};

export { withMutationModalHelperWithHOCs as withMutationModalHelper };
