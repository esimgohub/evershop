import PropTypes from 'prop-types';
import React from 'react';
import Button from '@components/common/form/Button';

export default function NewCurrencyButton({ newCurrencyUrl }) {
  return <Button url={newCurrencyUrl} title="New Currency" />;
}

NewCurrencyButton.propTypes = {
  newCurrencyUrl: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'pageHeadingRight',
  sortOrder: 10
};

export const query = `
  query Query {
    newCurrencyUrl: url(routeId: "currencyNew")
  }
`;
