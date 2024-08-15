import PropTypes from 'prop-types';
import React from 'react';
import Spinner from '@components/common/Spinner';
import { Input } from '@components/common/form/fields/Input';

export default function AccountDetails({ account }) {
  if (!account) {
    return <Spinner />;
  }

  return (
    <div className="flex-1 p-[40px]">
      <h2 className="mb-8 text-2xl font-semibold mb-3">Account Settings</h2>

      <div className="flex bg-[#ffffff] border-[1px] shadow-[lightgray] rounded-[8px]">
        <div className="w-full space-y-[12px] px-[32px] py-[40px]">
          <h3 className="font-bold">Personal Information</h3>

          <p className="text-[lightgray]">Contains basic user information</p>

          <div>
            <Input
              label="First Name"
              disabled
              className="w-[40%]"
              value={account.firstName ? account.firstName : '-'}
            />

            <Input
              label="Last Name"
              disabled
              className="w-[40%]"
              value={account.firstName ? account.firstName : '-'}
            />

            <Input
              disabled
              value={account.email}
              className="w-[40%]"
              label="Email address"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

AccountDetails.propTypes = {
  account: PropTypes.shape({
    email: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string
  }).isRequired
};

export const layout = {
  areaId: 'my-account',
  sortOrder: 10
};

export const query = `
  query Query {
    account: currentCustomer {
      uuid
      firstName
      lastName
      email
    }
  }
`;
