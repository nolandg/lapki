import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import MuiSelect from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';

const styles = theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120,
    maxWidth: 300,
  },
  muiSelect: {
  },
  paper: {
  },
  value: {
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing.unit * 1,
    },
  },
});

class Select extends React.Component {
  state = {
    values: [],
    open: false,
  };

  constructor(props) {
    super(props);

    const { theme } = this.props;
    this.paperStyle = {
      padding: theme.spacing.unit * 0,
    };
  }

  handleChange = (event) => {
    const newValues = event.target.value;
    const { multiple, maxSelections, minSelections } = this.props;

    if(multiple) {
      if(newValues.length > maxSelections) return;
      if(newValues.length < minSelections) return;
      this.setState({ values: newValues });
    }else{
      this.setState({
        values: [newValues],
        open: false,
      });
    }
  };

  getOption = (valueOrOption) => {
    const { options } = this.props;
    let value = valueOrOption;
    if(typeof valueOrOption === 'object') value = valueOrOption.value;

    const option = options.find(o => o.value === value);
    if(option === undefined) throw new Error(`No option for value "${value}" found in <Select>`);

    return option;
  }

  getText = (valueOrOption) => {
    const option = this.getOption(valueOrOption);
    return option.text;
  }

  renderValue = (value) => {
    const { classes } = this.props;
    const option = this.getOption(value);
    return (
      <div className={classes.value}>{option.icon}{option.text}</div>
    );
  }

  renderValues = (values) => {
    const { multiple } = this.props;

    if(multiple) {
      return (
        <div>
          {values.map(this.renderValue)}
        </div>
      );
    }
    return this.renderValue(values[0]);
  }

  render() {
    const { values: currentValues, open } = this.state;
    const { classes, options, label, multiple } = this.props;

    return (
      <div className={classes.root}>
        <FormControl className={classes.formControl}>
          <InputLabel htmlFor="select-multiple-checkbox">{label}</InputLabel>
          <MuiSelect
            open={open}
            onOpen={() => this.setState({ open: true })}
            onClose={() => this.setState({ open: false })}
            autoWidth
            multiple={multiple}
            value={currentValues}
            onChange={this.handleChange}
            input={<Input id="select-multiple-checkbox" />}
            MenuProps={{
              PaperProps: { style: this.paperStyle },
            }}
            className={classes.muiSelect}
            renderValue={this.renderValues}
          >
            {options.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {multiple && <Checkbox checked={!!this.state.values.find(v => v === option.value)} /> }
                {option.icon}
                <ListItemText primary={option.text} />
              </MenuItem>
            ))}
          </MuiSelect>
        </FormControl>
      </div>
    );
  }
}

Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired,
    }).isRequired,
  ).isRequired,
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  multiple: PropTypes.bool,
  label: PropTypes.string.isRequired,
  minSelections: PropTypes.number,
  maxSelections: PropTypes.number,
};
Select.defaultProps = {
  multiple: false,
  minSelections: 1,
  maxSelections: undefined,
};

const SelectEnhanced = withStyles(styles, { withTheme: true })(Select);
export { SelectEnhanced as Select };
