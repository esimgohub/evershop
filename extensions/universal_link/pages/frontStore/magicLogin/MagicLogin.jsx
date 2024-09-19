import React, { useEffect } from 'react';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import Spinner from '@components/common/Spinner';
const DeviceDetector = require('device-detector-js');

function MagicLogin(data) {
  const { mobileAppConfig, appStoreConfig } = data;

  const { baseUrl, url } = mobileAppConfig;
  const { googlePlayUrl, appStoreUrl } = appStoreConfig;

  // Extract query
  const { token } = window.location.search
    ? new URLSearchParams(window.location.search)
    : {};

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const detector = new DeviceDetector();
      const deviceInformation = detector.parse(window.navigator.userAgent);

      try {
        const isDesktop =
          deviceInformation.device.type.toLowerCase() === 'desktop';
        if (isDesktop) {
          window.location.href = googlePlayUrl;
        } else {
          if (deviceInformation.os.name.toLowerCase() === 'android') {
            document.location = `${url}?token=${token}`;
          }
          if (deviceInformation.os.name.toLowerCase() === 'ios') {
            document.location = `${baseUrl}?token=${token}`;
          }

          setTimeout(function () {
            const confirmed = confirm(
              'You do not seem to have Your App installed, do you want to go download it now?'
            );
            if (confirmed) {
              if (deviceInformation.os.name.toLowerCase() === 'android') {
                // Android device
                window.location.href = googlePlayUrl;
              } else if (deviceInformation.os.name.toLowerCase() === 'ios') {
                // iOS device
                window.location.href = appStoreUrl;
              } else {
                // Unsupported device
                res.send(
                  'This app is only available for Android and iOS devices.'
                );
              }
            }
          }, 300);
        }
      } catch (e) {
        console.log('to catch');
      } finally {
        return;
      }
    }
  }, []);

  return (
    <div className="fixed top-0 left-0 bottom-0 right-0 flex justify-center">
      <Spinner width={30} height={30} className="absolute-center" />
    </div>
  );
}

export const layout = {
  areaId: 'blank-layout-content',
  sortOrder: 25
};

export const query = `
  query Query {
    appStoreConfig {
      googlePlayUrl
      appStoreUrl
    }
    mobileAppConfig {
      baseUrl
      url
    }
  }
`;

export default MagicLogin;
