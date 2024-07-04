import React from 'react';
import Area from '@components/common/Area';
import LoadingBar from '@components/common/LoadingBar';
import './Layout.scss';
import './tailwind.scss';

export default function BlankLayout() {
  console.log('to blank body ne');

  return (
    <>
      <LoadingBar />
      <Area id="blank-layout-content" className="" noOuter />
    </>
  );
}

export const layout = {
  areaId: 'blank-body',
  sortOrder: 0
};
