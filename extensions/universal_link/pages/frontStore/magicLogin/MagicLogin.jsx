import React, { useState, useEffect } from 'react';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import { DeepLinkModal } from '../../../components/DeepLinkModal';
import { useDevice } from '../../../hooks/useDevice';
import Spinner from '@components/common/Spinner';
const MobileDetect = require('mobile-detect');

function MagicLogin() {
  const [mobileDetector, setMobileDetector] = useState(null);
  const { isMobile: isMobileScreen } = useDevice();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const md = new MobileDetect(window.navigator.userAgent);
      setMobileDetector(md.mobile() || md.tablet());
    }
  }, []);

  const renderContent = () => {
    if (isMobileScreen || (mobileDetector && mobileDetector === true)) {
      return (
        <div className="fixed top-0 left-0 bottom-0 right-0 flex justify-center">
          <Spinner width={30} height={30} className="absolute-center" />
        </div>
      );
    }

    return <p>Loading...</p>;
  };

  return renderContent();
}

export const layout = {
  areaId: 'blank-layout-content',
  sortOrder: 25
};

export default MagicLogin;
