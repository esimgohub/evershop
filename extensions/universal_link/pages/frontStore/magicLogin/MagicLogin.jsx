import React from 'react';
import { _ } from '@evershop/evershop/src/lib/locale/translate';
import { DeepLinkModal } from '../../../components/DeepLinkModal';
import { useDevice } from '../../../hooks/useDevice';
import Spinner from '@components/common/Spinner';
const MobileDetect = require('mobile-detect');


function MagicLogin() {
  const { isMobile: isMobileScreen } = useDevice();

  const md = new MobileDetect(window.navigator.userAgent);
  const isAccessOnMobile = md.mobile() || md.tablet();

  
  if (isMobileScreen || isAccessOnMobile) {
    return (
      <div className="fixed top-0 left-0 bottom-0 right-0 flex justify-center">
        <Spinner width={30} height={30} className="absolute-center" />
      </div>
    );
  }

  return (
    <DeepLinkModal title="Nofication" webPageUrl='https://esimgohub.com' />
  );
}

export const layout = {
  areaId: 'blank-layout-content',
  sortOrder: 25
};

export default MagicLogin;
