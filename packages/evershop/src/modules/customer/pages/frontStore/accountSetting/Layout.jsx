import PropTypes from 'prop-types';
import React from 'react';
import { toast } from 'react-toastify';
import Area from '@components/common/Area';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import SettingIcon from '@heroicons/react/outline/CogIcon';
import UserIcon from '@heroicons/react/outline/UserIcon';
import Button from '@components/common/form/Button';
import { useAlertContext } from '@components/common/modal/Alert';

export default function Layout({ logoutUrl }) {
  const { openAlert, closeAlert } = useAlertContext();

  const handleConfirmLogout = async () => {
    try {
      const response = await fetch(logoutUrl, {
        method: 'GET'
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error.message);
      } else {
        toast.success('Logout successfully');

        window.location.href = '/account/login';
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  const logout = async () => {
    console.log('to logout');

    openAlert({
      heading: `Alert`,
      content: 'Are you sure you want to logout?',
      primaryAction: {
        title: 'Cancel',
        onAction: closeAlert,
        variant: 'normal'
      },
      secondaryAction: {
        title: 'Save',
        onAction: handleConfirmLogout,
        variant: 'primary',
        isLoading: false
      }
    });
  };

  return (
    <div className="bg-[#F9FAFB] ">
      <div className="flex h-screen">
        {/* <!-- Sidebar --> */}
        <aside className="w-64 py-3 shadow-[lightgray_4px_0px_15px_0px] hidden md:block">
          <div className="px-[28px] flex flex-col h-full">
            <div className="flex items-center mb-8">
              <img
                src="https://gohub.com/wp-content/uploads/2023/10/logo_blue-1-e1696096183290.webp"
                alt="Gohub Logo"
                className="mb-2 w-[180px]"
              />
            </div>

            <nav
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignContent: 'space-between'
              }}
              className="mt-3 flex-1"
            >
              <ul className="space-y-[5px]">
                <li>
                  <a
                    href="/account/my-account"
                    className="text-[18px] rounded-[8px] py-1 px-2 flex items-center cursor-pointer hover:text-[#ffffff] hover:bg-[#43D3FE] font-medium"
                  >
                    <UserIcon
                      className="mr-1 text-[20px]"
                      width={20}
                      height={20}
                    />
                    <label className="cursor-pointer">My Profile</label>
                  </a>
                </li>
                <li>
                  <a className="text-[18px] rounded-[8px] py-1 px-2 flex items-center bg-[#43D3FE] text-[#ffffff] cursor-not-allowed font-medium">
                    <SettingIcon
                      className="mr-1 text-[20px]"
                      width={20}
                      height={20}
                    />
                    <label className="cursor-not-allowed">
                      Account Settings
                    </label>
                  </a>
                </li>
              </ul>

              <Button
                buttonClassName="!text-[18px] !bg-[transparent] hover:opacity-[0.8] hover:!text-[#43D3FE]"
                title="Logout"
                variant="text"
                onAction={logout}
              />
            </nav>
          </div>
        </aside>

        {/* <!-- Account Setting Content --> */}
        <Area id="account-setting" noOuter />
      </div>
    </div>
  );
}

Layout.propTypes = {
  logoutUrl: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'blank-layout-content',
  sortOrder: 10
};

export const query = `
  query Query {
    logoutUrl: url(routeId: "customerLogoutJson")
  }
`;
