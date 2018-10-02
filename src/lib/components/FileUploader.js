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
    backgroundColor: red[500],
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
  renderFile = ({ loaded, src, file, uri }) => {
    const { classes } = this.props;
    return(
      <Card key={uri} className={classes.card}>
        <CardActionArea className={classes.actionArea}>
          {loaded
            ? <CardMedia image={src} title={`Preview for ${file.name}`} className={classes.media} />
            // ? <img src={src} alt={`Preview for ${file.name}`} className={classes.mediaImg} />
            : <CircularProgress className={classes.progress} size={50} />
          }
          <CardContent>
            <Typography variant="body1">{file.name}</Typography>
          </CardContent>
        </CardActionArea>
        <CardActions className={classes.actions}>
          <Button style={{ color: red[500] }} onClick={() => this.removeFile(file)} size="small">
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
};
PreviewFileList = withStyles(previewStyles)(PreviewFileList);


class FileUploader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      previews: {},
    };
  }

  onDrop = (files) => {
    const { previews } = this.state;
    const { onChange } = this.props;
    onChange(files[0]);

    let modifiedPreviews = false;
    files.forEach((file) => {
      const uri = file.preview;
      const preview = previews[uri];

      if(!preview) {
        const reader = new window.FileReader();
        const newPreview = {
          uri,
          file,
          loaded: false,
          reader,
        };
        reader.onload = (e) => {
          newPreview.src = e.target.result;
          newPreview.loaded = true;
          this.forceUpdate();
        };
        reader.readAsDataURL(file);
        previews[uri] = newPreview;
        modifiedPreviews = true;
      }
    });

    if(modifiedPreviews) this.setState({ previews });
  }

  render() {
    const { previews } = this.state;
    const { classes, label, helperText, error, disabled, ...rest } = this.props;

    return (
      <FormControl className={classes.formControl} error={error} disabled={disabled}>
        <Typography variant="body1">{label}</Typography>
        <Dropzone
          onDrop={this.onDrop}
          accept="image/*"
          disabled={disabled}
          acceptClassName="accept"
          activeClassName="active"
          className={classes.dropzone}
          disabledClassName="disabled"
          rejectClassName="reject"
          maxSize={20e6}
          {...rest}
        >
          <UploadIcon style={{ fontSize: 50 }} color="primary" />
          <Typography variant="headline" gutterBottom>Drag & Drop files here or</Typography>
          <Button color="primary" variant="contained" size="large">
            <FolderIcon /><span>Browse for files</span>
          </Button>
        </Dropzone>
        <PreviewFileList files={previews} />
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
};
FileUploader.defaultProps = {
  helperText: undefined,
  error: undefined,
  disabled: undefined,
  value: undefined,
};

const FileUploaderEnhanced = withFormFields(withStyles(styles)(FileUploader));
export { FileUploaderEnhanced as FileUploader };
