import PropTypes from 'prop-types';
import React from 'react';
import { Card } from '@components/admin/cms/Card';

export default function SocialLinkSettingMenu({ socialLinkSettingUrl }) {
  return (
    <Card.Session title={<a href={socialLinkSettingUrl}>Social Setting</a>}>
      <div>Configure the socials</div>
    </Card.Session>
  );
}

SocialLinkSettingMenu.propTypes = {
  socialLinkSettingUrl: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 10
};

export const query = `
  query Query {
    socialLinkSettingUrl: url(routeId: "socialLinkSetting")
  }
`;
