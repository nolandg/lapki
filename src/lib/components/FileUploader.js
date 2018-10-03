import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Dropzone from 'react-dropzone';
import _ from 'lodash';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardActionArea from '@material-ui/core/CardActionArea';
import DeleteIcon from '@material-ui/icons/Delete';
import UploadIcon from '@material-ui/icons/CloudUpload';
import FolderIcon from '@material-ui/icons/FolderOpen';
import Card from '@material-ui/core/Card';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import CardMedia from '@material-ui/core/CardMedia';
import red from '@material-ui/core/colors/red';


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

const previewStyles = theme => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 0,
    flexWrap: 'wrap',
  },
  card: {
    padding: 0,
    width: 200,
    margin: theme.spacing.unit * 2,
    '&:last-child': { marginRight: 0 },
    '&:first-child': { marginLeft: 0 },
  },
  actionArea: {
    width: '100%',
  },
  mediaImg: {
    width: '100%',
  },
  media: {
    height: 150,
  },
});

class PreviewFileList extends React.Component {
  renderFile = ({ loaded, src, file, id }) => {
    const { classes, removeFile } = this.props;

    return(
      <Card key={id} className={classes.card}>
        <CardActionArea className={classes.actionArea}>
          {loaded
            ? <CardMedia image={src} title={`Preview for ${file.name}`} className={classes.media} />
            : <CircularProgress className={classes.progress} size={50} />
          }
          <CardContent>
            <Typography variant="body1">{file.name}</Typography>
          </CardContent>
        </CardActionArea>
        <CardActions className={classes.actions}>
          <Button style={{ color: red[500] }} onClick={() => removeFile(file)} size="small">
            <DeleteIcon /><span>Remove</span>
          </Button>
        </CardActions>
      </Card>
    );
  }

  render() {
    const { files, classes } = this.props;

    return (
      <div className={classes.root}>
        {_.map(files, this.renderFile)}
      </div>
    );
  }
}

PreviewFileList.propTypes = {
  classes: PropTypes.object.isRequired,
  files: PropTypes.object.isRequired,
  removeFile: PropTypes.func.isRequired,
};
PreviewFileList = withStyles(previewStyles)(PreviewFileList);


class FileUploader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      previews: {},
      inputKey: Math.random().toString(36),
    };
  }

  removeFile = (file) => {
    const { previews } = this.state;
    const { onChange, multiple } = this.props;
    const id = this.getId(file);

    delete previews[id];
    this.setState({ previews });

    let value = _.map(previews, p => p.file);
    if(!multiple) value = value[0];
    onChange(value);
  }

  getId = file => file.name

  onDrop = (files, supressUpstream = false) => {
    const { previews } = this.state;
    const { onChange, multiple } = this.props;
    const value = multiple ? files : files[0];
    if(!supressUpstream) onChange(value);

    let modifiedPreviews = false;

    _.forEach(previews, (preview) => {
      const file = files.find(f => this.getId(f) === this.getId(preview.id));
      if(!file) {
        delete previews[preview.id];
        modifiedPreviews = true;
      }
    });

    files.forEach((file) => {
      const id = this.getId(file);
      const preview = previews[id];

      if(!preview) {
        const newPreview = {
          id,
          file,
          src: file.src,
          loaded: file.loaded,
        };

        if(!newPreview.loaded) {
          const reader = new window.FileReader();
          reader.onload = (e) => {
            newPreview.src = e.target.result;
            newPreview.loaded = true;
            this.forceUpdate();
          };
          reader.readAsDataURL(file);
        }
        previews[id] = newPreview;
        modifiedPreviews = true;
      }
    });

    if(modifiedPreviews) this.setState({ previews });
  }

  componentDidUpdate(prevProps, prevState) {
    const { value } = this.props;

    if(!_.isEqual(prevProps.value, value)) {
      this.setState({ inputKey: Math.random().toString(36) }); // eslint-disable-line
      const files = this.convertInputValueToFiles(value);
      this.onDrop(files, true);
    }
  }

  convertInputValueToFiles = (value) => {
    const files = [];

    if(!Array.isArray(value)) value = [value];

    value.forEach((f) => {
      if(!f) return;

      if(!f.filename) {
        console.log(value);
      }

      const file = {
        name: f.filename,
        src: f.location,
        loaded: true,
      };
      files.push(file);
    });

    return files;
  }

  render() {
    const { previews, inputKey } = this.state;
    const { classes, label, helperText, error, disabled, multiple, ...rest } = this.props;
    const { value } = this.props;


    return (
      <FormControl className={classes.formControl} error={error} disabled={disabled}>
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
          {...rest}
        >
          <UploadIcon style={{ fontSize: 50 }} color="primary" />
          <Typography variant="headline" gutterBottom>Drag & Drop files here or</Typography>
          <Button color="primary" variant="contained" size="large">
            <FolderIcon /><span>Browse for files</span>
          </Button>
        </Dropzone>
        <PreviewFileList files={previews} removeFile={this.removeFile} />
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
};
FileUploader.defaultProps = {
  helperText: undefined,
  error: undefined,
  disabled: undefined,
  value: undefined,
  multiple: false,
};

const FileUploaderEnhanced = withFormFields(withStyles(styles)(FileUploader));
export { FileUploaderEnhanced as FileUploader };
