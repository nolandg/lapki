import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { HTMLRenderer } from 'ory-editor-renderer'; // eslint-disable-line import/no-extraneous-dependencies

import plugins from './plugins';
import oryStyles from '../../styles/oryStyles.json';

const styles = theme => ({
  ory: oryStyles.root,
});

const RichRenderer = ({ json, className, options, classes }) => {
  // {render: false} will prevent renderer from going all the way to html and instead keep the React elments
  options = { render: false, ...options };

  return (
    <div className={`${classes.ory} ${className}`}>
      <HTMLRenderer state={json} plugins={plugins.plugins} options={options} />
    </div>
  );
};

RichRenderer.propTypes = {
  json: PropTypes.object.isRequired,
  className: PropTypes.string,
  options: PropTypes.object,
  classes: PropTypes.object.isRequired,
};
RichRenderer.defaultProps = {
  className: '',
  options: {},
};
const EnhancedRichRendered = withStyles(styles)(RichRenderer);
export { EnhancedRichRendered as RichRenderer };
