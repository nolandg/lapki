import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { HTMLRenderer } from 'ory-editor-renderer'; // eslint-disable-line import/no-extraneous-dependencies

import plugins from './plugins';
import oryStyles from '../../styles/oryStyles.json';

const styles = theme => ({
  ory: {
    ...oryStyles.root,
    '& .ory-cell-sm-6': {
      '@media only screen and (min-width: 48em)': {
        flexBasis: '100%',
        width: '100%',
        minWidth: '100%',
      },
      '@media only screen and (min-width: 70em)': {
        flexBasis: '50%',
        width: '50%',
        minWidth: '50%',
      },
    },
  },
});

const RichRenderer = ({ json, className, options, classes }) => {
  // {render: false} will prevent renderer from going all the way to html and instead keep the React elments
  options = { render: false, ...options };

  return (
    <div className={`ory ${classes.ory} ${className}`}>
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
