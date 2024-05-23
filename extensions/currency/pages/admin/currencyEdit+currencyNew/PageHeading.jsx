import PropTypes from 'prop-types';
import React from 'react';
import PageHeading from '@components/admin/cms/PageHeading';

export default function CurrencyEditPageHeading({
  backUrl,
  getCurrency: currency
}) {
  return (
    <div className="w-2/3" style={{ margin: '0 auto' }}>
      <PageHeading
        backUrl={backUrl}
        heading={
          currency ? `Editing ${currency.code}` : 'Create A New Currency'
        }
      />
    </div>
  );
}

CurrencyEditPageHeading.propTypes = {
  backUrl: PropTypes.string.isRequired,
  currency: PropTypes.shape({
    code: PropTypes.string
  })
};

CurrencyEditPageHeading.defaultProps = {
  currency: {}
};

export const layout = {
  areaId: 'content',
  sortOrder: 5
};

export const query = `
  query Query {
    getCurrency(id: getContextValue("currencyId", null)) {
      code
    }
    backUrl: url(routeId: "currencyGrid")
  }
`;
