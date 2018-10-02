import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import MuiTextField from '@material-ui/core/TextField';
import moment from 'moment';

import { withFormFields } from '../HOCs/withFormFields';
import { Select } from './Select';

const styles = theme => ({
  formControl: {

  },
  controls: {
    display: 'flex',
    justifyContent: 'flex-start',
    '& > *': {
      margin: {
        right: theme.spacing.unit * 4,
      },
    },
    '& .year': {
      width: 80,
    },
    '& .month': {
      minWidth: 120,
    },
    '& .day': {
      minWidth: 80,
    },
  },
});

class YearMonthDayPicker extends React.Component {
   static intToDate = (int) => {
     if(!int) int = 0;
     const str = int.toString();
     const year = parseInt(str.slice(0, -4), 10) || 0;
     const month = parseInt(str.slice(-4, -2), 10) || 0;
     const day = parseInt(str.slice(-2), 10) || 0;

     return { year, month, day };
   };

   static intToMoment(int) {
     const { year, month, day } = YearMonthDayPicker.intToDate(int);
     const m = moment.utc().year(year).month(month - 1)
       .date(day);
     return m;
   }

  static dateToInt = (date) => {
    const { year } = date;
    let { month, day } = date;
    if(month <= 9) month = `0${month}`;
    if(day <= 9) day = `0${day}`;
    const int = `${year}${month}${day}`;
    return parseInt(int, 10);
  };

  handleYearChange = (event) => {
  };

  handleChange = (part, newValue) => {
    const { onChange, value } = this.props;
    const date = YearMonthDayPicker.intToDate(value);
    date[part] = newValue;
    const int = YearMonthDayPicker.dateToInt(date);
    onChange(int);
  }

  handleYearChange = ({ target: { value } }) => {
    this.handleChange('year', value);
  }

  handleMonthChange = (value) => {
    this.handleChange('month', value[0]);
  }

  handleDayChange = (value) => {
    this.handleChange('day', value[0]);
  }

  render() {
    const { classes, label, helperText, error, disabled, value } = this.props;
    const { year, month, day } = YearMonthDayPicker.intToDate(value);

    return (
      <FormControl className={classes.formControl} error={error} disabled={disabled}>
        <Typography variant="body1">{label}</Typography>
        <div className={classes.controls}>
          <MuiTextField
            className="year"
            label="Year"
            disabled={disabled}
            value={year}
            type="number"
            onChange={this.handleYearChange}
          />
          <Select
            className="month"
            label="Month"
            disabled={disabled}
            value={[month]}
            options={YearMonthDayPicker.monthOptions}
            onChange={this.handleMonthChange}
          />
          <Select
            className="day"
            label="Day"
            disabled={disabled}
            value={[day]}
            options={YearMonthDayPicker.dayOptions}
            onChange={this.handleDayChange}
          />
        </div>
        <FormHelperText>{helperText}</FormHelperText>
      </FormControl>
    );
  }
}

YearMonthDayPicker.monthOptions = [
  { value: 1, text: 'January' },
  { value: 2, text: 'February' },
  { value: 3, text: 'March' },
  { value: 4, text: 'April' },
  { value: 5, text: 'May' },
  { value: 6, text: 'June' },
  { value: 7, text: 'July' },
  { value: 8, text: 'August' },
  { value: 9, text: 'September' },
  { value: 10, text: 'October' },
  { value: 11, text: 'November' },
  { value: 12, text: 'December' },
];

YearMonthDayPicker.dayOptions = [];
for(let i = 1; i <= 31; i += 1) {
  YearMonthDayPicker.dayOptions.push({ value: i, text: i.toString() });
}


YearMonthDayPicker.propTypes = {
  classes: PropTypes.object.isRequired,
  helperText: PropTypes.node,
  error: PropTypes.bool,
  disabled: PropTypes.bool,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};
YearMonthDayPicker.defaultProps = {
  helperText: undefined,
  error: undefined,
  disabled: undefined,
  value: undefined,
};

const YearMonthDayPickerEnhanced = withFormFields(withStyles(styles)(YearMonthDayPicker));
YearMonthDayPickerEnhanced.intToMoment = YearMonthDayPicker.intToMoment;
export { YearMonthDayPickerEnhanced as YearMonthDayPicker };
