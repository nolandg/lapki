import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'react-apollo';
import { withStyles } from '@material-ui/core/styles';
import CodeIcon from '@material-ui/icons/Code';
import TextField from '@material-ui/core/TextField';

import { withUser } from '../../HOCs/withUser';
// import Select from '../Select';

const rendererStyles = theme => ({
  root: {

  },
});

class Renderer extends React.Component {
  render() {
    const { state: { value }, classes } = this.props;

    return (
      <div className={classes.root} dangerouslySetInnerHTML={{ __html: value }} />
    );
  }
}
Renderer.propTypes = {
  state: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};
Renderer = compose(
  withStyles(rendererStyles),
)(Renderer);

const editorStyles = theme => ({
  root: {

  },
});

class Editor extends React.Component {
  handleChange = (event) => {
    this.props.onChange({ value: event.target.value });
  };

  render() {
    const { state: { value }, classes, currentUser } = this.props;

    if(!currentUser.hasPerm('use-dangerous-editors')) {
      return (
        <div className={classes.denied}>
        This is an advanced editor feature and is doesn't seem to be enabled for your user account.<br /><br />
        If you think you should have access to this feature, please contact the site administrator.
        </div>
      );
    }

    return (
      <div className={classes.root}>
        <TextField
          onChange={this.handleChange}
          value={value || ''}
          label="HTML Code:"
          margin="normal"
          multiline
          rows={8}
          rowsMax={20}
          variant="outlined"
          fullWidth
        />
      </div>
    );
  }
}
Editor.propTypes = {
  state: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  currentUser: PropTypes.object.isRequired,
};
Editor = compose(
  withStyles(editorStyles),
  withUser,
)(Editor);

const CustomContent = ({ readOnly, ...rest }) => {
  if(readOnly) return <Renderer {...rest} />;
  return <Editor {...rest} />;
};
CustomContent.propTypes = {
  readOnly: PropTypes.bool.isRequired,
};


export default {
  Component: CustomContent,
  IconComponent: <CodeIcon />,
  name: 'lapki/content/custom-content',
  version: '0.0.1',
  text: 'Custom Content',
};
