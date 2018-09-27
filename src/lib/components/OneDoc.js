import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';


import { DocList } from './DocList';

const styles = theme => ({
  loading: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.unit * 8,
  },
});

class OneDoc extends Component {
  normalizeResult = (result) => {
    if(result.docs && result.docs.length) result.doc = result.docs[0];
    return result;
  };

  renderNoResult = () => <Typography variant="body1">Sorry, that content could not be found.</Typography>

  renderLoaded = (docs, renderFuncs, result) => {
    console.log(docs.length);
    const renderNoResult = this.props.renderNoResult || this.renderNoResult;

    if(!docs || !docs.length) return renderNoResult;
    return renderFuncs.renderDoc(docs[0]);
  }

  render() {
    const { render, where, ...rest } = this.props;
    if(!where) {
      console.warn('You must supply a where parameter to OneDoc.');
    }
    const oneDocRender = render ? result => render(this.normalizeResult(result)) : render;

    return (
      <DocList
        render={oneDocRender}
        renderLoaded={this.renderLoaded}
        where={where}
        {...rest}
      />
    );
  }
}

OneDoc.propTypes = {
  renderDoc: PropTypes.func,
  renderError: PropTypes.func,
  render: PropTypes.func,
  renderLoading: PropTypes.func,
  renderNoResult: PropTypes.func,
};
OneDoc.defaultProps = {
  renderDoc: null,
  renderError: null,
  render: null,
  renderLoading: null,
  renderNoResult: null,
};

OneDoc = withStyles(styles)(OneDoc);

export { OneDoc };
