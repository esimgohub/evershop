import PropTypes, { shape } from 'prop-types';
import React from 'react';
import './CurrencySwitcher.scss';

export default function CurrencySwitcher({ getSummaryCurrencies = [] }) {
  const onSelectChange = (e) => {
    document.cookie = `isoCode=${e.target.value}`;

    window.location.reload();
  };

  const isoCodeKey = document.cookie
    .split('; ')
    .find((c) => c.startsWith('isoCode'));
  const isoCodeValue = isoCodeKey ? isoCodeKey.split('=')[1] : null;

  return (
    <select onChange={onSelectChange} className="currency-switcher">
      {getSummaryCurrencies.map((currency) => (
        <option selected={isoCodeValue === currency.code} value={currency.code}>
          {currency.code}
        </option>
      ))}
    </select>
  );
}

CurrencySwitcher.propTypes = {
  getSummaryCurrencies: shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    rate: PropTypes.number.isRequired,
    signature: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired
  })
};

CurrencySwitcher.defaultProps = {
  cart: null
};

export const layout = {
  areaId: 'icon-wrapper',
  sortOrder: 9
};

export const query = `
query Query {
  getSummaryCurrencies {
    code
  }
}
`;
