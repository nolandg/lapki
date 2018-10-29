import React from 'react';
import PropTypes from 'prop-types';
import { HTMLRenderer } from 'ory-editor-renderer'; // eslint-disable-line import/no-extraneous-dependencies

import plugins from './plugins';

const RichRenderer = ({ json, className, options }) => {
  // {render: false} will prevent renderer from going all the way to html and instead keep the React elments
  options = { render: false, ...options };

  return (
    <div className={className}>
      <HTMLRenderer state={json} plugins={plugins.plugins} options={options} />
    </div>
  );
};
RichRenderer.propTypes = {
  json: PropTypes.object.isRequired,
  className: PropTypes.string,
  options: PropTypes.object,
};
RichRenderer.defaultProps = {
  className: '',
  options: {},
};
const EnhancedRichRendered = (RichRenderer);
export { EnhancedRichRendered as RichRenderer };
