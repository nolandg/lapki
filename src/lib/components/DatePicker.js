import React, { Component } from 'react';
import MomentUtils from 'material-ui-pickers/utils/moment-utils';
import MuiPickersUtilsProvider from 'material-ui-pickers/utils/MuiPickersUtilsProvider';
// import TimePicker from 'material-ui-pickers/TimePicker';
import MuiDatePicker from 'material-ui-pickers/DatePicker';
// import DateTimePicker from 'material-ui-pickers/DateTimePicker';
import { withStyles } from '@material-ui/core/styles';

import { withFormFields } from '../HOCs/withFormFields';

const styles = theme => ({
  paper: {
    padding: 0,
  },
});

class DatePicker extends Component {
  // constructor(props) {
  //   super(props);
  //   const { value } = props;
  //   this.state = { value: value || new Date() };
  // }

  // handleDateChange = (date) => {
  //   this.setState({ selectedDate: date });
  // }

  handleChange = (date) => {
    console.log(date.year());

    this.props.onChange(date);
  }

  render() {
    const { value, onChange, classes, ...rest } = this.props;
    // const { value } = this.state;

    return (
      <MuiPickersUtilsProvider utils={MomentUtils}>
        <MuiDatePicker
          value={value}
          onChange={this.handleChange}
          // keyboard
          // format="YYYY/MM/DD"
          // placeholder="+/-YYYY/MM/DD"
          // mask={v => (v ? [/\+-/, /\d/, /\d/, /\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/] : [])}
          disableOpenOnEnter
          DialogProps={{ PaperProps: { className: classes.paper } }}
          {...rest}
        />
      </MuiPickersUtilsProvider>
    );
  }
}

const EnhancedDatePicker = withFormFields(withStyles(styles)(DatePicker));
export { EnhancedDatePicker as DatePicker };
