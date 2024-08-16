import React, { useState } from 'react';
import Button from '@components/common/form/Button';
import axios from 'axios';
import { Input } from '@components/common/form/fields/Input';
import { toast } from 'react-toastify';

export default function AccountSettings({ baseUrl, account }) {
  const [deleteText, setDeleteText] = useState('');
  const [isDeletingAccount, setDeleteAccountStatus] = useState(false);

  console.log('baseUrl: ', baseUrl);
  const handleDeleteAccount = async () => {
    try {
      setDeleteAccountStatus(true);
      const response = await axios.delete(
        `${baseUrl}/api/v1/customers/${account.customerId}`,
        null
      );
      const { data, error } = response.data;
      if (error) {
        throw new Error(error.message);
      }

      setDeleteText('');

      toast.success('Account deleted successfully');

      window.location.href = '/account/login';
    } catch (error) {
      console.log('delete account error: ', error);
      toast.error(error.message);
    } finally {
      setDeleteAccountStatus(false);
    }
  };

  return (
    <div className="flex-1 py-[40px] px-[20px] md:px-[40px]">
      <h2 className="mb-8 text-2xl font-semibold mb-3">Account Settings</h2>

      <div className="flex bg-[#ffffff] shadow-[0_0_10px_0_rgba(0,0,0,0.1)] rounded-[8px]">
        <div className="w-full space-y-2 px-[32px] py-[40px]">
          <h3 className="text-[#CF3738] font-bold">Delete Account</h3>

          <p>
            Deleting your account will remove all of your personal data. This
            cannot be undone.
          </p>

          <div>
            <label className="text-[gray] text-[14px]">
              to confirm this, type <strong>DELETE</strong>
            </label>
            <div className="space-x-1 flex">
              <Input
                className="w-[250px]"
                onChange={(e) => setDeleteText(e.target.value)}
                defaultValue={deleteText}
              />

              <Button
                isLoading={isDeletingAccount}
                title="Confirm"
                disabled={deleteText !== 'delete' && deleteText !== 'DELETE'}
                variant="delete"
                onAction={handleDeleteAccount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'account-setting',
  sortOrder: 10
};

export const query = `
  query Query {
    baseUrl
    account: currentCustomer {
      customerId
    }
  }
`;
