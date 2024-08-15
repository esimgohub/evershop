import React from 'react';
import Area from '@components/common/Area';

export function Body() {
  return (
    <div id="app" className="bg-background">
      <Area id="blank-body" className="wrapper" />
      <Area id="body" className="wrapper" />
    </div>
  );
}
