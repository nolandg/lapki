
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'react-apollo';
import { withStyles } from '@material-ui/core/styles';
import CodeIcon from '@material-ui/icons/Code';
import TextField from '@material-ui/core/TextField';
import Helmet from 'react-helmet';
import { withRouter } from 'react-router';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import { withUser } from '../../HOCs/withUser';

const rendererStyles = theme => ({
  root: {

  },
});

class Renderer extends React.Component {
  constructor(props) {
    super(props);

    if (typeof window !== 'undefined') {
      if (props.state.reload && window._lapki_route_transitions_count) {
        window.location.reload();
      }
    }
  }

  componentDidMount = () => {
    const { state: { js } } = this.props;
    // eslint-disable-next-line no-eval
    eval(js);
  }

  render() {
    const { state: { html, remoteJs, value }, classes } = this.props;

    return (
      <React.Fragment>
        <Helmet>
          <script src={remoteJs} />
        </Helmet>
        <div className={classes.root} dangerouslySetInnerHTML={{ __html: html || value }} />
      </React.Fragment>
    );
  }
}
Renderer.propTypes = {
  state: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};
Renderer = compose(
  withStyles(rendererStyles),
  withRouter,
)(Renderer);

const editorStyles = theme => ({
  denied: {
    border: 'dashed 2px rgba(0,0,0,.2);',
    padding: theme.spacing.unit * 1,
    color: '#666',
  },
  deniedMessage: {
    fontStyle: 'italic',
  },
});

class Editor extends React.Component {
  handleChange = key => (event) => {
    this.props.onChange({ [`${key}`]: event.target.value });
  };

  render() {
    const { state: { html, js, remoteJs, reload }, classes, currentUser } = this.props;

    if (!currentUser.hasPerm('use-dangerous-editors')) {
      return (
        <div className={classes.denied}>
          <div className={classes.deniedMessage}>
            This is an advanced editor section and is not enabled for your user account.
            If you think you should have access to edit this section, please contact the site administrator.
            <br /><br />
            Content:
          </div>
          <Renderer state={this.props.state} />
        </div>
      );
    }

    return (
      <div className={classes.root}>
        <TextField
          onChange={this.handleChange('html')}
          value={html || ''}
          label="HTML:"
          margin="normal"
          multiline
          rows={8}
          rowsMax={20}
          variant="outlined"
          fullWidth
        />
        <TextField
          onChange={this.handleChange('js')}
          value={js || ''}
          label="Java Script:"
          margin="normal"
          multiline
          rows={8}
          rowsMax={20}
          variant="outlined"
          fullWidth
        />
        <TextField
          onChange={this.handleChange('remoteJs')}
          value={remoteJs || ''}
          label="Remote Script URL:"
          margin="normal"
          variant="outlined"
          fullWidth
        />
        <FormControlLabel
          control={(
            <Switch
              checked={reload}
              onChange={this.handleChange('reload')}
              value="checkedB"
              color="primary"
            />
          )}
          label="Reload page if not initial load"
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
  if (readOnly) return <Renderer {...rest} />;
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
