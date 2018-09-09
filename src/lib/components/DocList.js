import React, { Component } from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import pluralize from 'pluralize';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Button from '@material-ui/core/Button';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import Typography from '@material-ui/core/Typography';

import { Mutator } from './Mutator';
import { pascalToCamel } from '../utils/stringUtils';
// import gqlError from '../utils/gqlError';

class DocList extends Component {
  buildQuery = (collection, fragmentName) => {
    const uniqueTag = DocList.queryCount;
    DocList.queryCount += 1;
    const operationName = `${pluralize.plural(collection.type)}ListConnectionDocList${uniqueTag}`;
    const queryName = `${pluralize.plural(pascalToCamel(collection.type))}Connection`;
    const fragment = collection.fragments[fragmentName];
    const fragmentDefinitionName = fragment.definitions[0].name.value;

    const query = gql`
      ${fragment}

      query ${operationName}($skip: Int!, $first: Int!)
      {
        ${queryName}(first: $first, skip: $skip){
          aggregate {
            count
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          edges {
            cursor
            node {
              ...${fragmentDefinitionName}
            }
          }
        }
      }
    `;

    return { query, operationName };
  }

  constructor(props) {
    super(props);
    const { collection, fragmentName } = props;

    this.state = {
      skip: 0,
    };

    const { query, operationName } = this.buildQuery(collection, fragmentName);
    this.query = query;
    Mutator.registerQuery(operationName);
  }

  renderLoading = result => <div>Loading...</div>

  renderError = (error, result) => <div>Error: {error.message}</div>

  renderNoResults = result => <div>No results to show :-(</div>

  renderFields = (doc) => {
    const fields = [];
    _.forOwn(doc, (fieldValue, fieldName) => {
      fields.push((
        <div key={fieldValue} className="field">
          <span className="field-name">{fieldName}:&nbsp;</span>
          <span className="field-value">{JSON.stringify(fieldValue)}</span>
        </div>
      ));
    });
    return fields;
  }

  renderDoc = doc => (
    <div className="doc" key={doc.id}>
      {this.renderFields(doc)}
    </div>
  )

  gotoNextPage = () => {
    this.setState(state => ({ skip: state.skip + this.props.first }));
  }

  gotoPreviousPage = () => {
    this.setState(state => ({ skip: state.skip - this.props.first }));
  }

  renderPaginationControls = (location, { gotoPreviousPage, gotoNextPage }, { pageInfo, totalDocs }) => {
    const { skip } = this.state;
    const { first } = this.props;
    const totalPages = Math.ceil(totalDocs / first);
    const pageNumber = Math.ceil(skip / first) + 1;

    // Prisma is bizzare with pageInfo's has next/prev page flags so we need to calculate these ourselves
    const hasNextPage = skip + first < totalDocs;
    const hasPreviousPage = skip > 0;

    return (
      <div className="pagination">
        <Button onClick={gotoPreviousPage} disabled={!hasPreviousPage}><ChevronLeftIcon />Prev</Button>
        <Typography variant="body1" component="span">Page {pageNumber} of {totalPages}</Typography>
        <Button onClick={gotoNextPage} disabled={!hasNextPage}>Next<ChevronRightIcon /></Button>
      </div>
    );
  }

  renderWhereControls = (location, result) => <div>Where Controls Here</div>

  renderOrderByControls = (location, result) => <div>Order By Controls Here</div>

  renderControls = (location, { renderPaginationControls, renderWhereControls, renderOrderByControls }, result) => {
    const controlsAtLocation = this.props.locations[location];

    const showPagination = controlsAtLocation.includes('pagination');
    const showWhere = controlsAtLocation.includes('where');
    const showOrderBy = controlsAtLocation.includes('order-by');

    const paginationFuncs = {
      gotoNextPage: this.gotoNextPage,
      gotoPreviousPage: this.gotoPreviousPage,
    };

    return (
      <div className="doc-list-controls">
        {showPagination ? renderPaginationControls(location, paginationFuncs, result) : null}
        {showWhere ? renderWhereControls(location, result) : null}
        {showOrderBy ? renderOrderByControls(location, result) : null}
      </div>
    );
  }

  renderProp = (result) => {
    const { renderLoaded, render, collection } = this.props;
    const { data, networkStatus, error } = result;
    const loading = networkStatus === 1;

    // Normalize the result a bit
    const queryName = `${pascalToCamel(pluralize.plural(collection.type))}Connection`;
    if(!loading && !error) {
      const queryData = data[queryName];
      result.docs = queryData.edges.map(edge => edge.node);
      result.totalDocs = queryData.aggregate.count;
      result.pageInfo = queryData.pageInfo;
    }

    if(render) {
      // Parent handles rendering everything in all cases
      return render(result);
    }

    // Parents wants us to handle error and loading branching
    const renderFuncs = {
      renderDoc: this.props.renderDoc || this.renderDoc,
      renderError: this.props.renderError || this.renderError,
      renderLoading: this.props.renderLoading || this.renderLoading,
      renderControls: this.props.renderControls || this.renderControls,
      renderPaginationControls: this.props.renderPaginationControls || this.renderPaginationControls,
      renderWhereControls: this.props.renderWhereControls || this.renderWhereControls,
      renderOrderByControls: this.props.renderOrderByControls || this.renderOrderByControls,
      renderNoResults: this.props.renderNoResults || this.renderNoResults,
    };

    if(error) {
      return renderFuncs.renderError(error, result);
    }
    if(loading) {
      return renderFuncs.renderLoading(result);
    }

    if(renderLoaded) {
      // Parent will render everything after docs are loaded
      return renderLoaded(result.docs, renderFuncs, result);
    }

    // We will render individual docs using our or parent-supplied doc render function
    return (
      <div className="doc-list">
        {renderFuncs.renderControls('top', renderFuncs, result)}
        <div className="list">
          {result.docs.length
            ? result.docs.map(renderFuncs.renderDoc)
            : renderFuncs.renderNoResults(result)
          }
        </div>
        {renderFuncs.renderControls('bottom', renderFuncs, result)}
      </div>
    );
  }

  render() {
    const { collection, fragmentName, errorPolicy, first, variables, ...rest } = this.props;
    const { skip } = this.state;

    const controlledVariables = {
      ...variables,
      skip,
      first,
    };

    return (
      <Query
        query={this.query}
        variables={controlledVariables}
        errorPolicy={errorPolicy}
        notifyOnNetworkStatusChange
        children={this.renderProp}
        {...rest}
      />
    );
  }
}

DocList.propTypes = {
  collection: PropTypes.object.isRequired,
  fragmentName: PropTypes.string,
  variables: PropTypes.object,
  errorPolicy: PropTypes.string,
  renderDoc: PropTypes.func,
  renderError: PropTypes.func,
  renderLoaded: PropTypes.func,
  render: PropTypes.func,
  renderLoading: PropTypes.func,
  renderControls: PropTypes.func,
  renderPaginationControls: PropTypes.func,
  renderWhereControls: PropTypes.func,
  renderOrderByControls: PropTypes.func,
  renderNoResults: PropTypes.func,
  locations: PropTypes.object,
  first: PropTypes.number,
};
DocList.defaultProps = {
  fragmentName: 'default',
  variables: {},
  errorPolicy: 'none',
  renderDoc: null,
  renderError: null,
  renderLoaded: null,
  render: null,
  renderLoading: null,
  renderControls: null,
  renderPaginationControls: null,
  renderWhereControls: null,
  renderOrderByControls: null,
  renderNoResults: null,
  locations: {
    top: ['pagination'],
    bottom: ['pagination'],
  },
  first: 10,
};

DocList.queryCount = 0;


export { DocList };
