import PropTypes from 'prop-types';
import React from 'react';
import Spinner from '@components/common/Spinner';
import { Input } from '@components/common/form/fields/Input';
import Button from '@components/common/form/Button';

export default function AccountDetails({ account }) {
  if (!account) {
    return <Spinner />;
  }

  return (
    <div className="flex-1 py-[40px] px-[20px] md:px-[40px]">
      <h2 className="mb-8 text-2xl font-semibold mb-3">Account Settings</h2>

      <div className="flex bg-[#ffffff] shadow-[0_0_10px_0_rgba(0,0,0,0.1)] rounded-[8px]">
        <div className="w-full space-y-[12px] px-[32px] py-[40px]">
          <h3 className="font-bold">Personal Information</h3>

          <p className="text-[gray]">Contains basic user information</p>

          <div className="w-full md:w-[40%]">
            <Input label="First Name" disabled value={account.firstName} />

            <Input label="Last Name" disabled value={account.lastName} />

            <Input disabled value={account.email} label="Email address" />

            {/* <div className="float-right mt-[16px]">
              <Button
                title="Save"
                onAction={() => {

                }}
              />
            </div> */}
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
