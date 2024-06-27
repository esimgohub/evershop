import { DeepLinkModal } from '../../../components/DeepLinkModal';
import PropTypes from 'prop-types';
import React from 'react';
import { useDevice } from '../hooks/use-device';

export default function ProductShared() {
  const { isMobile } = useDevice();

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 bottom-0 right-0 flex justify-center">
        <Spinner width={30} height={30} className="absolute-center" />
      </div>
    );
  }

  return <DeepLinkModal title="Nofication" content="Do you want to continue?" webPageUrl="https://esimgohub.com" />
}

ProductShared.propTypes = {
  action: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

