import React from 'react';
import { compose, withApollo } from 'react-apollo';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Select from 'react-select';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import NoSsr from '@material-ui/core/NoSsr';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Chip from '@material-ui/core/Chip';
import MenuItem from '@material-ui/core/MenuItem';
import CancelIcon from '@material-ui/icons/Cancel';
import FormHelperText from '@material-ui/core/FormHelperText';
import { emphasize } from '@material-ui/core/styles/colorManipulator';

import { withFormFields } from '../HOCs/withFormFields';

const styles = theme => ({
  root: {
    flexGrow: 1,
    // marginTop: theme.spacing.unit * 3,
    // marginBottom: theme.spacing.unit * 1,
  },
  input: {
    display: 'flex',
    padding: 0,
    '& svg': {
      cursor: 'pointer',
    },
  },
  valueContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  chip: {
    margin: `${theme.spacing.unit / 2}px ${theme.spacing.unit / 4}px`,
  },
  chipFocused: {
    backgroundColor: emphasize(
      theme.palette.type === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
      0.08,
    ),
  },
  noOptionsMessage: {
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
  },
  singleValue: {
    fontSize: 16,
  },
  placeholder: {
    position: 'absolute',
    left: 2,
    fontSize: 16,
  },
  paper: {
    padding: 0,
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
  },
});

function NoOptionsMessage(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.noOptionsMessage}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

function inputComponent({ inputRef, ...props }) {
  return <div ref={inputRef} {...props} />;
}

function Control(props) {
  return (
    <TextField
      fullWidth
      InputProps={{
        inputComponent,
        inputProps: {
          className: props.selectProps.classes.input,
          inputRef: props.innerRef,
          children: props.children,
          ...props.innerProps,
        },
      }}
      {...props.selectProps.textFieldProps}
    />
  );
}

function Option(props) {
  return (
    <MenuItem
      buttonRef={props.innerRef}
      selected={props.isFocused}
      component="div"
      style={{
        fontWeight: props.isSelected ? 500 : 400,
      }}
      {...props.innerProps}
    >
      {props.children}
    </MenuItem>
  );
}

function Placeholder(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.placeholder}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

function SingleValue(props) {
  return (
    <Typography className={props.selectProps.classes.singleValue} {...props.innerProps}>
      {props.children}
    </Typography>
  );
}

function ValueContainer(props) {
  return <div className={props.selectProps.classes.valueContainer}>{props.children}</div>;
}
ValueContainer.propTypes = {
  selectProps: PropTypes.object.isRequired,
  children: PropTypes.node,
};
ValueContainer.defaultProps = {
  children: null,
};

function MultiValue(props) {
  return (
    <Chip
      tabIndex={-1}
      label={props.children}
      className={classNames(props.selectProps.classes.chip, {
        [props.selectProps.classes.chipFocused]: props.isFocused,
      })}
      onDelete={props.removeProps.onClick}
      deleteIcon={<CancelIcon {...props.removeProps} />}
    />
  );
}

function Menu(props) {
  return (
    <Paper square className={props.selectProps.classes.paper} {...props.innerProps}>
      {props.children}
    </Paper>
  );
}

const components = {
  Control,
  Menu,
  MultiValue,
  NoOptionsMessage,
  Option,
  Placeholder,
  SingleValue,
  ValueContainer,
};

class IntegrationReactSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: [],
      value: null,
      inputValue: '',
    };
  }

  handleChange = (value) => {
    const { transformValue, onChange } = this.props;
    this.setState({ value });
    if(onChange) onChange(transformValue(value.value));
  };

  handleInputValueChange = (value) => {
    const { client, query, labelKey, valueKey } = this.props;
    this.setState({ inputValue: value });

    client.query({ query, variables: { query: value }, fetchPolicy: 'network-only' }).then((result) => {
      const suggestions = result.data.titleSuggestions.map(s => ({ value: s[valueKey], label: s[labelKey] }));
      this.setState({ suggestions });
    }).catch((error) => {
      console.error('Error getting title suggestions: ', error);
    });
  }

  render() {
    const { suggestions, inputValue, value } = this.state;
    const { classes, theme, placeholder, label, multiple, helperText, ...rest } = this.props;

    const selectStyles = {
      input: base => ({
        ...base,
        color: theme.palette.text.primary,
        '& input': {
          font: 'inherit',
        },
      }),
    };

    return (
      <div className={classes.root}>
        <NoSsr>
          <Select
            value={value}
            onChange={this.handleChange}
            isMulti={multiple}
            placeholder={placeholder}
            textFieldProps={{
              label,
              InputLabelProps: {
                shrink: true,
              },
            }}
            classes={classes}
            styles={selectStyles}
            options={suggestions}
            components={components}
            onInputChange={this.handleInputValueChange}
            inputValue={inputValue}
            filterOption={() => true}
            {...rest}
          />
          {helperText ? <FormHelperText>{helperText}</FormHelperText> : null }
        </NoSsr>
      </div>
    );
  }
}

IntegrationReactSelect.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  multiple: PropTypes.bool,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  client: PropTypes.object.isRequired,
  labelKey: PropTypes.string,
  valueKey: PropTypes.string,
  transformValue: PropTypes.func,
  query: PropTypes.object.isRequired,
  onChange: PropTypes.func,
  helperText: PropTypes.node,
};
IntegrationReactSelect.defaultProps = {
  multiple: false,
  placeholder: '',
  label: '',
  valueKey: 'id',
  labelKey: 'title',
  onChange: null,
  transformValue: value => value,
  helperText: null,
};

const Autocomplete = compose(
  withFormFields,
  withStyles(styles, { withTheme: true }),
  withApollo,
)(IntegrationReactSelect);

export { Autocomplete };
