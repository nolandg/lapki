import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import classNames from 'classnames';

class ResponsiveImage extends Component {
  buildClassName = () => {
    const { className } = this.props;
    return classNames(className, 'responsive-image');
  }

  renderFixedSize = (location) => {
    const { image, size, sizes, className, ...rest } = this.props;
    return <img {...rest} src={location} className={this.buildClassName()} />; // eslint-disable-line jsx-a11y/alt-text
  }

  render() {
    const { image, size, sizes, className, ...rest } = this.props;

    if(!image) return null; // no image
    if(!image.sizes) {
      console.warn(`Trying to render responsive image "${image.filename}" but it has no sizes defined in database. Falling back to original.`);
      return this.renderFixedSize(image.location); // no size options
    }
    if(size) {
      // caller requested specific size
      if(image.sizes[size]) return this.renderFixedSize(image.sizes[size].location);

      console.warn(`Image size "${size}" not found for image ID ${image.id}, falling back to original.`);
      return this.renderFixedSize(image.location);
    }
    if(!sizes) {
      console.warn('Responsive image rendering without size or sizes specified, falling back to original.');
      return this.renderFixedSize(image.location);
    }

    // Caller must want a responsive image with sizes specified

    // Build srcset string from all sizes with known widths
    const srcsetAttr = _.reduce(image.sizes, (acc, s) => {
      if(!s.width) return acc;

      return `${acc}${s.location} ${s.width}w,\n`;
    }, '\n');

    // Build sizes attribute assuming passed in sizes is of shape {<max-width>: <slot-width>}
    const sizesAttr = sizes.reduce((acc, { maxWidth, slotWidth }) => {
      if(maxWidth) return `${acc}(max-width: ${maxWidth}px) ${slotWidth},\n`;
      return `${slotWidth}\n`;
    }, '\n');

    return (
      <img // eslint-disable-line jsx-a11y/alt-text
        {...rest}
        srcSet={srcsetAttr}
        sizes={sizesAttr}
        src={image.location}
        className={this.buildClassName()}
      />
    );
  }
}
ResponsiveImage.propTypes = {
  image: PropTypes.object,
  className: PropTypes.string,
  size: PropTypes.string,
  sizes: PropTypes.array,
};
ResponsiveImage.defaultProps = {
  image: null,
  className: '',
  size: null,
  sizes: null,
};

export { ResponsiveImage };
