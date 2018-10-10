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

// import wordIcon from '../../../images/icon-word.png';
// import excelIcon from '../../../images/icon-excel.png';
// import pdfIcon from '../../../images/icon-pdf.png';
// import fileIcon from '../../../images/icon-file.png';

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
    width: 200,
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
    height: 150,
  },
});

class FileList extends React.Component {
  getFilenameExtension = (filename) => {
    const ext = filename.match(/\.([0-9a-z4]+$)/i)[1];
    if(ext) return ext.toLowerCase();
    return '';
  }

  getImageSrc = ({ location, mimetype, filename }) => {
    if(mimetype.startsWith('image')) return location;

    const ext = this.getFilenameExtension(filename);
    switch(ext) {
      case 'doc': case 'docx': case 'docm': case 'odt':
        return 'wordIcon';
      // case 'xls': case 'xlsx': case 'xlsm': case 'ods':
      //   return excelIcon;
      // case 'pdf':
      //   return pdfIcon;
      // default: return fileIcon;
      default: return '';
    }
  }

  renderFile = (file) => {
    const { id, filename } = file;
    const { classes, actions } = this.props;
    const src = this.getImageSrc(file);

    return(
      <Card key={id} className={classes.card}>
        <CardActionArea className={classes.actionArea}>
          {src
            ? <CardMedia image={src} title={`Preview for ${filename}`} className={classes.media} />
            : <CircularProgress className={classes.progress} size={50} />
          }
          <CardContent>
            <Typography variant="body1">{filename}</Typography>
          </CardContent>
        </CardActionArea>
        {actions && actions.length && (
          <CardActions className={classes.actions}>
            {actions.map(({ name, buttonProps, children, func }) => (
              <Button {...buttonProps} key={name} onClick={() => func(id)} size="small">
                {children}
              </Button>
            ))}
          </CardActions>
        )}
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
};
FileList = withStyles(styles)(FileList);
export { FileList };
