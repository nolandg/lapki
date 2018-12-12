import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
// import _ from 'lodash';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardActionArea from '@material-ui/core/CardActionArea';
import Card from '@material-ui/core/Card';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import CardMedia from '@material-ui/core/CardMedia';
import DownloadIcon from '@material-ui/icons/CloudDownload';
import { withRouter } from 'react-router';

import { ResponsiveImage } from './ResponsiveImage';

import wordIcon from '../../../images/icon-word.png';
import excelIcon from '../../../images/icon-excel.png';
import pdfIcon from '../../../images/icon-pdf.png';
import fileIcon from '../../../images/icon-file.png';

const styles = theme => ({
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
    width: 250,
    margin: theme.spacing.unit * 2,
    '&:last-child': { marginRight: 0 },
    '&:first-child': { marginLeft: 0 },
  },
  actionArea: {
    width: '100%',
    textAlign: 'center',
  },
  mediaImg: {
    width: '100%',
  },
  media: {
    height: 100,
  },
});

class FileList extends React.Component {
  getFilenameExtension = (filename) => {
    const ext = filename.match(/\.([0-9a-z4]+$)/i)[1];
    if(ext) return ext.toLowerCase();
    return '';
  }

  getImageSrc = ({ location, mimetype, filename, sizes }) => {
    if(mimetype.startsWith('image')) {
      if(sizes && sizes.thumb) return { src: sizes.thumb.location, isImage: true };
      return { src: location, isImage: true };
    }

    const ext = this.getFilenameExtension(filename);
    switch(ext) {
      case 'doc': case 'docx': case 'docm': case 'odt':
        return { src: wordIcon, isImage: false };
      case 'xls': case 'xlsx': case 'xlsm': case 'ods':
        return { src: excelIcon, isImage: false };
      case 'pdf':
        return { src: pdfIcon, isImage: false };
      default: return { src: fileIcon, isImage: false };
    }
  }

  renderFile = (file) => {
    const { id, filename, location } = file;
    const { classes, actions, showDownloadButton } = this.props;
    const { src, isImage } = this.getImageSrc(file);
    const backgroundSize = isImage ? 'cover' : 'contain';
    const handleClick = location ? () => window.open(location) : null;

    return(
      <Card key={id} className={classes.card}>
        <CardActionArea className={classes.actionArea} to={src} onClick={handleClick}>
          {src
            ? <CardMedia image={src} style={{ backgroundSize }} title={`Preview for ${filename}`} className={classes.media} />
            : <CircularProgress className={classes.progress} size={50} />
          }
          <CardContent>
            <Typography>{filename}</Typography>
          </CardContent>
        </CardActionArea>
        {showDownloadButton || actions.length ? (
          <CardActions className={classes.actions}>
            {actions.map(({ name, buttonProps, children, func }) => (
              <Button {...buttonProps} key={name} onClick={() => func(id)} size="small">
                {children}
              </Button>
            ))}
            {showDownloadButton && location ? (
              <Button key="__download" onClick={handleClick} size="small" color="primary">
                <DownloadIcon /><span>Download</span>
              </Button>
            ) : null}
          </CardActions>
        ) : null}
      </Card>
    );
  }

  render() {
    const { files, classes } = this.props;

    return (
      <div className={classes.root}>
        {files.map(this.renderFile)}
      </div>
    );
  }
}

FileList.propTypes = {
  classes: PropTypes.object.isRequired,
  files: PropTypes.array.isRequired,
  actions: PropTypes.array,
  showDownloadButton: PropTypes.bool,
};
FileList.defaultProps = {
  actions: [],
  showDownloadButton: true,
};

FileList = withRouter(withStyles(styles)(FileList));
export { FileList };
