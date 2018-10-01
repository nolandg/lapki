import React, { PureComponent } from 'react';
import MomentUtils from 'material-ui-pickers/utils/moment-utils';
import MuiPickersUtilsProvider from 'material-ui-pickers/utils/MuiPickersUtilsProvider';
// import TimePicker from 'material-ui-pickers/TimePicker';
import DatePicker from 'material-ui-pickers/DatePicker';
// import DateTimePicker from 'material-ui-pickers/DateTimePicker';

export default class App extends PureComponent {
  // constructor(props) {
  //   super(props);
  //   const { value } = props;
  //   this.state = { value: value || new Date() };
  // }

  // handleDateChange = (date) => {
  //   this.setState({ selectedDate: date });
  // }

  render() {
    const { value, onChange, ...rest } = this.props;
    // const { value } = this.state;

    return (
      <MuiPickersUtilsProvider utils={MomentUtils}>
        <DatePicker
          value={value}
          onChange={onChange}
          {...rest}
        />
      </MuiPickersUtilsProvider>
    );
  }
}
