import { compose } from 'react-apollo';
import React, { Component } from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import Editor, { Editable, createEmptyState } from 'ory-editor-core'; // eslint-disable-line import/no-extraneous-dependencies
import { Trash, DisplayModeToggle, Toolbar } from 'ory-editor-ui'; // eslint-disable-line import/no-extraneous-dependencies
import { withFormFields } from '../../HOCs'; // eslint-disable-line import/no-extraneous-dependencies

import oryStyles from '../../styles/oryStyles.json';
import plugins from './plugins';

const editable = createEmptyState();
const editor = new Editor({
  ...plugins,
  editables: [editable],
});

editor.trigger.mode.edit();

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
  loading: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: {
      top: theme.spacing.unit * 4,
      bottom: theme.spacing.unit * 4,
      left: theme.spacing.unit * 4,
      right: theme.spacing.unit * 4,
    },

    '& > p': {
      marginTop: theme.spacing.unit * 2,
    },
  },
});

class RichEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingEditorProgress: 0,
      editableState: props.value,
    };
    editor.trigger.editable.update(props.value);
  }

  componentDidMount() {
    const editorLoadTime = 500;
    const editorProgressInterval = 50;
    const editorProgressStep = 100 / (editorLoadTime / editorProgressInterval);

    this.editorProgressIntervalHandle = setInterval(() => {
      if(this.state.loadingEditorProgress >= 100) {
        clearInterval(this.editorProgressIntervalHandle);
        return;
      }

      this.setState(
        ({ loadingEditorProgress }) => ({ loadingEditorProgress: loadingEditorProgress + editorProgressStep }),
      );
    }, editorProgressInterval);
  }

  componentWillUnmount() {
    clearInterval(this.editorProgressIntervalHandle);
  }

  handleChange = (state) => {
    this.setState({ editableState: state });
    this.props.onChange(state);
  }

  render() {
    const { classes, className } = this.props;
    const { loadingEditorProgress, editableState } = this.state;

    if(loadingEditorProgress < 100) {
      return (
        <div className={`${classes.loading} ${className}`}>
          <CircularProgress size={50} variant="determinate" value={loadingEditorProgress} />
          <Typography>Loading editor...</Typography>
        </div>
      );
    }

    return (
      <div className={`${classes.ory} ${className}`}>
        <Editable
          editor={editor}
          id={editableState.id}
          onChange={this.handleChange}
        />

        <div>
          <Trash editor={editor} />
          <DisplayModeToggle editor={editor} />
          <Toolbar editor={editor} />
        </div>
      </div>
    );
  }
}

RichEditor.propTypes = {
  // className: PropTypes.string,
  // match: PropTypes.object.isRequired,
  // currentUser: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  value: PropTypes.object.isRequired,
};
RichEditor.defaultProps = {
  className: '',
  // className: '',
  // currentUser: null,
};

RichEditor = compose(
  withFormFields,
  withStyles(styles),
)(RichEditor);

export { RichEditor };
