import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import MuiSelect from '@material-ui/core/Select';
// import Checkbox from '@material-ui/core/Checkbox';
import FormHelperText from '@material-ui/core/FormHelperText';

import { withFormFields } from '../HOCs/withFormFields';

const styles = theme => ({
  formControl: {

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
    padding: {
      top: theme.spacing.unit * 1,
      bottom: theme.spacing.unit * 1,
    },
    '&:not(:last-child)': {
      borderBottom: 'solid 1px rgba(0,0,0,.14)',
    },
  },
});

class Select extends React.Component {
  constructor(props) {
    super(props);

    const { theme } = this.props;
    this.paperStyle = {
      padding: theme.spacing.unit * 0,
    };

    this.state = {
      open: false,
    };
  }

  handleChange = (event) => {
    const newValues = event.target.value;
    const { multiple, maxSelections, minSelections, onChange, value: oldValue } = this.props;

    if(multiple) {
      if(newValues.length > maxSelections) onChange(oldValue);
      else if(newValues.length < minSelections) onChange(oldValue);
      onChange(newValues);
    }else{
      this.setState({
        open: false,
      });
      onChange(newValues);
    }
  };

  getOption = (valueOrOption) => {
    const { options } = this.props;
    let value = valueOrOption;
    if(typeof valueOrOption === 'object') value = valueOrOption.value;

    const option = options.find(o => o.value === value);
    // if(option === undefined) console.warn(`No option for value "${value}" found in <Select>`);

    return option;
  }

  getText = (valueOrOption) => {
    const option = this.getOption(valueOrOption);
    return option.text;
  }

  renderValue = (value) => {
    const { classes } = this.props;
    const option = this.getOption(value);
    if(!option) return null;
    return (
      <div key={option.value} className={classes.value}>{option.icon}{option.text}</div>
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
    return this.renderValue(values);
  }

  handleCheckboxChange = (event) => {
    // Prevent the checkbox event from setting a new value which is shit
    // This allows event to bubble up to option/list item that properly sets new value on change
    event.stopPropagation();
    event.preventDefault();
  }

  render() {
    const { open } = this.state;
    const { classes, options, label, multiple, helperText, error, disabled, className, value, minSelections, maxSelections, fieldProps, ...rest } = this.props;

    return (
      <FormControl {...rest} className={`${classes.formControl} ${className}`} error={error} disabled={disabled}>
        {label ? <InputLabel htmlFor="select-multiple-checkbox">{label}</InputLabel> : null }
        <MuiSelect
          open={open}
          onOpen={() => this.setState({ open: true })}
          onClose={() => this.setState({ open: false })}
          autoWidth
          disabled={disabled}
          multiple={multiple}
          value={value}
          onChange={this.handleChange}
          input={<Input id="select-multiple-checkbox" />}
          MenuProps={{
            PaperProps: { style: this.paperStyle },
          }}
          className={classes.muiSelect}
          renderValue={this.renderValues}
        >
          {options.map((option) => { // eslint-disable-line
            const checked = !!value.find && !!value.find(v => v === option.value);
            return (
              <MenuItem key={option.value} value={option.value}>
                {multiple ? <Checkbox checked={checked} onChange={this.handleCheckboxChange} /> : null }
                {option.icon}
                <ListItemText primary={option.text} />
              </MenuItem>
            );
          })}
        </MuiSelect>
        <FormHelperText>{helperText}</FormHelperText>
      </FormControl>
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
  className: PropTypes.string,
  theme: PropTypes.object.isRequired,
  multiple: PropTypes.bool,
  label: PropTypes.string,
  minSelections: PropTypes.number,
  maxSelections: PropTypes.number,
  helperText: PropTypes.node,
  error: PropTypes.bool,
  disabled: PropTypes.bool,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
};
Select.defaultProps = {
  multiple: false,
  minSelections: 1,
  maxSelections: 20,
  helperText: undefined,
  error: undefined,
  disabled: undefined,
  value: undefined,
  className: '',
  label: '',
};

const SelectEnhanced = withFormFields(withStyles(styles, { withTheme: true })(Select));
export { SelectEnhanced as Select };
