/* eslint-disable eqeqeq */
import PropTypes from 'prop-types';
import React from 'react';
import Error from '@components/common/form/fields/Error';
import '../Field.scss';

function CheckedIcon(props) {
  const { disabled } = props;

  return (
    <span
      className={`radio-checked ${
        disabled ? '!border-[lightgray] cursor-not-allowed' : ''
      }`}
    >
      <span className={disabled ? '!bg-[lightgray]' : ''} />
    </span>
  );
}

function UnCheckedIcon(props) {
  const { disabled } = props;

  return (
    <span
      className={`radio-unchecked ${disabled ? 'cursor-not-allowed' : ''}`}
    />
  );
}

function Radio(props) {
  const {
    name,
    value,
    label,
    onChange,
    error,
    instruction,
    options,
    disabled
  } = props;
  const [_value, setValue] = React.useState(value || '');
  const onChangeFunc = (e) => {
    setValue(e.target.value);
    if (onChange) onChange.call(window, e.target.value);
  };

  React.useEffect(() => {
    setValue(value);
  }, [value]);

  return (
    <div className={`form-field-container ${error ? 'has-error' : null}`}>
      {label && <label htmlFor={name}>{label}</label>}
      <div className="field-wrapper radio-field">
        {options.map((o, i) => (
          <div key={o.value}>
            <label htmlFor={name + i} className="flex">
              <input
                type="radio"
                name={name}
                id={name + i}
                disabled={disabled}
                value={o.value}
                checked={_value == o.value}
                onChange={onChangeFunc}
              />
              {_value == o.value && <CheckedIcon disabled={disabled} />}
              {_value != o.value && <UnCheckedIcon disabled={disabled} />}
              <span className="pl-1">{o.text}</span>
            </label>
          </div>
        ))}
      </div>
      {instruction && (
        <div className="field-instruction mt-sm">{instruction}</div>
      )}
      <Error error={error} />
    </div>
  );
}

Radio.propTypes = {
  error: PropTypes.string,
  instruction: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      text: PropTypes.string
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

Radio.defaultProps = {
  error: undefined,
  instruction: undefined,
  label: undefined,
  onChange: undefined,
  value: undefined
};

export { Radio };
