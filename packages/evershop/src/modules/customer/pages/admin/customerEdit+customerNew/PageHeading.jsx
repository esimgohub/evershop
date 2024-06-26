import PropTypes from 'prop-types';
import React from 'react';
import PageHeading from '@components/admin/cms/PageHeading';

export default function CustomerEditPageHeading({ backUrl, customer }) {
  return (
    <PageHeading
      backUrl={backUrl}
      heading={
        customer
          ? `Editing ${customer.firstName} ${customer.lastName}`
          : 'Create A New Customer'
      }
    />
  );
}

CustomerEditPageHeading.propTypes = {
  backUrl: PropTypes.string.isRequired,
  customer: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired
  })
};

CustomerEditPageHeading.defaultProps = {
  customer: null
};

export const layout = {
  areaId: 'content',
  sortOrder: 5
};

export const query = `
  query Query {
    customer(id: getContextValue("customerUuid", null)) {
      firstName
      lastName
    }
    backUrl: url(routeId: "customerGrid")
  }
`;
