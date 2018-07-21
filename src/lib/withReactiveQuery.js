/**
 * HOC to provide a reactive query that registers itself with the mutation handler
   and refetches the query when needed.

   Takes query and variables as arguments.


   eg: withReactiveQuery(POSTS_QUERY, { start: 0, limit: 3 })(PostsList);
 */

import React, { Component } from 'react';
import { graphql } from 'react-apollo';
import PropTypes from 'prop-types';
import qatch from 'await-to-js';

import queryManager from './queryManager';
import gqlError from './gqlError';

const withRefetch = function (WrappedComponent, queryVariables) {
  class withRefetchClass extends Component {
    constructor(props) {
      super(props);
      this.state = {
        variables: queryVariables,
      };
      queryManager.register(this.refetch);
    }

    refetch = async () => {
      const [error] = await qatch(this.props.data.refetch(this.state.variables));
      if(error) {
        console.error(gqlError(error).message);
        console.error(error);
      }
    }

    setVariables = (func, cb) => {
      if(typeof func !== 'function') {
        throw Error('You must pass a function to setVariables(). See React functional setState() for details');
      }
      this.setState(state => ({ variables: func(state.variables) }), () => {
        if(typeof cb === 'function') cb();
        this.refetch();
      });
    }

    getVariables = () => this.state.variables

    render() {
      const { data } = this.props;
      if(data.error) {
        data.error = gqlError(data.error);
      }
      return <WrappedComponent {...this.props} data={data} setVariables={this.setVariables} getVariables={this.getVariables} />;
    }
  }
  withRefetchClass.propTypes = {
    data: PropTypes.object.isRequired,
  };

  return withRefetchClass;
};


function withReactiveQuery(query, queryVariables, graphqlOptions) {
  const defaultOptions = {
    errorPolicy: 'none',
    variables: queryVariables,
  };
  const options = { ...defaultOptions, ...graphqlOptions };
  const config = {
    options,
  };

  return WrappedComponent => graphql(query, config)(withRefetch(WrappedComponent, queryVariables));
}

export default withReactiveQuery;
