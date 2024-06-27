import PropTypes from 'prop-types';
import React from 'react';
import { Card } from '@components/admin/cms/Card';

export default function SliderSettingMenu({ sliderSettingUrl }) {
  return (
    <Card.Session title={<a href={sliderSettingUrl}>Slider Setting</a>}>
      <div>Configure the sliders</div>
    </Card.Session>
  );
}

SliderSettingMenu.propTypes = {
  sliderSettingUrl: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 10
};

export const query = `
  query Query {
    sliderSettingUrl: url(routeId: "sliderSetting")
  }
`;
