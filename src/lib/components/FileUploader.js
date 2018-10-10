import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Dropzone from 'react-dropzone';
import _ from 'lodash';
import UploadIcon from '@material-ui/icons/CloudUpload';
import FolderIcon from '@material-ui/icons/FolderOpen';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import red from '@material-ui/core/colors/red';

import { FileList } from './FileList';
import { withFormFields } from '../HOCs/withFormFields';

const styles = theme => ({
  dropzone: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    width: '100%',
    border: 'dashed 3px rgba(0,0,0,.4)',
    borderRadius: 5,
    padding: theme.spacing.unit * 2,
    backgroundColor: 'rgba(0,0,0,.1)',
  },
  reject: {
  },
  active: {
  },
  accept: {
  },
  formControl: {

  },
});

class FileUploader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      files: {},
      prevValue: null,
      inputKey: FileUploader.generateInputKey(),
      errors: [],
    };
  }

  resetInput = () => {
    this.setState({ inputKey: FileUploader.generateInputKey });
  }

  static generateInputKey = () => Math.random().toString(36)

  buildFileId = (file) => {
    if(file.isExisting) return file.id;

    if(file.name) return file.name;
    if(file.filename) return file.filename;
    if(file.preview) return file.preview;

    console.error('Could not build an id for file: ', file);
    return 'none';
  }

  updateParentValueWithFiles = (files) => {
    const value = FileUploader.convertFilesToValue(files);
    this.props.onChange(value);
  }

  removeFile = (id) => {
    const { files } = this.state;

    delete files[id];
    this.setState({ files });

    this.updateParentValueWithFiles(files);
  }

  onDrop = (accepted, rejected) => {
    const { multiple } = this.props;
    let { files } = this.state;

    // If we're only a one-file uploader then remove existing files
    if(!multiple && accepted.length) {
      files = {};
    }

    // Add any new accepted files
    accepted.forEach((file) => {
      const id = this.buildFileId(file);
      if(files[id]) {
        // We already know about this file, nothing to do
        return;
      }

      // New file, add it to state
      const newFile = {
        isNew: true,
        newFileData: { id, ...file, file },
        existingFileData: null,
      };
      newFile.reader = new window.FileReader();
      newFile.reader.onload = (e) => {
        newFile.newFileData.location = e.target.result;
        this.forceUpdate();
      };
      newFile.reader.readAsDataURL(file);

      files[id] = newFile;
    });

    // Generate errors for all rejected files
    const errors = rejected.map(file => `Rejected "${file.name}".`);

    // Update the state
    this.setState({ files, errors });

    this.updateParentValueWithFiles(files);
  }

  static convertFilesToValue = (files) => {
    const newFiles = _.map(_.filter(files, f => f.isNew), f => f.newFileData);
    const existingFiles = _.map(_.filter(files, f => !f.isNew), f => f.existingFileData);
    return { newFiles, existingFiles };
  }

  static convertValueToFiles = (value) => {
    const files = {};

    if(Array.isArray(value)) {
      value.forEach((f) => {
        files[f.id] = {
          id: f.id,
          isNew: f.isNew,
          newFileData: f.isNew ? f : null,
          existingFileData: f.isNew ? null : f,
        };
      });
    }else{
      _.forEach(value.newFiles, (f) => {
        files[f.id] = {
          id: f.id,
          isNew: true,
          newFileData: f,
        };
      });
      _.forEach(value.existingFiles, (f) => {
        files[f.id] = {
          id: f.id,
          isNew: false,
          existingFileData: f,
        };
      });
    }

    return files;
  }

  static getDerivedStateFromProps(props, state) {
    if(!_.isEqual(props.value, state.prevValue)) {
      return {
        inputKey: FileUploader.generateInputKey(),
        prevValue: props.value,
        files: FileUploader.convertValueToFiles(props.value),
      };
    }

    return null;
  }


  render() {
    const { files, inputKey, errors } = this.state;
    const { classes, label, helperText, error, disabled, multiple, className } = this.props;

    const previewFiles = _.map(files, (file) => {
      let ret;
      if(file.isNew) {
        ret = file.newFileData;
        ret.filename = ret.file.name;
        ret.mimetype = ret.file.type;
      }else {
        ret = file.existingFileData;
      }
      return ret;
    });

    const previewActions = [{
      name: 'remove',
      func: this.removeFile,
      buttonProps: { style: { color: red[500] } },
      children: <Fragment><DeleteIcon /><span>Remove</span></Fragment>,
    }];

    return (
      <FormControl className={`${classes.formControl} ${className}`} error={error} disabled={disabled}>
        <Typography variant="body1">{label}</Typography>
        <Dropzone
          onDrop={this.onDrop}
          disabled={disabled}
          acceptClassName="accept"
          activeClassName="active"
          className={classes.dropzone}
          disabledClassName="disabled"
          rejectClassName="reject"
          maxSize={20e6}
          multiple={multiple}
          inputProps={{ key: inputKey }}
        >
          <UploadIcon style={{ fontSize: 50 }} color="primary" />
          <Typography variant="headline" gutterBottom>Drag & Drop files here or</Typography>
          <Button color="primary" variant="contained" size="large">
            <FolderIcon /><span>Browse for files</span>
          </Button>
          <div className={classes.errors}>
            {errors.map(e => <div>{e}</div>)}
          </div>
        </Dropzone>
        <FileList files={previewFiles} actions={previewActions} />
        <FormHelperText>{helperText}</FormHelperText>
      </FormControl>
    );
  }
}

FileUploader.propTypes = {
  classes: PropTypes.object.isRequired,
  helperText: PropTypes.node,
  error: PropTypes.bool,
  disabled: PropTypes.bool,
  // value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  multiple: PropTypes.bool,
  value: PropTypes.any, // eslint-disable-line
  className: PropTypes.string,
};
FileUploader.defaultProps = {
  helperText: undefined,
  error: undefined,
  disabled: undefined,
  value: [],
  multiple: false,
  className: '',
};

const FileUploaderEnhanced = withFormFields(withStyles(styles)(FileUploader));
export { FileUploaderEnhanced as FileUploader };
