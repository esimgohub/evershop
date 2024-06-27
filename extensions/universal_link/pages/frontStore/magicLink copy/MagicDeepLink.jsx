import PropTypes from 'prop-types';
import React from 'react';

export default function MagicLink() {
  return (
    <div className="fixed top-0 left-0 bottom-0 right-0 flex justify-center">
      <Spinner width={30} height={30} className="absolute-center" />
    </div>
  );
}

MagicLink.propTypes = {
  action: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

