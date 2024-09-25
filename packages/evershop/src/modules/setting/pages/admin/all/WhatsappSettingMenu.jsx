import PropTypes from 'prop-types';
import React from 'react';
import { Card } from '@components/admin/cms/Card';

export default function WhatsappSettingMenu({ whatsappSettingUrl }) {
  return (
    <Card.Session title={<a href={whatsappSettingUrl}>Whatsapp Setting</a>}>
      <div>Configure Whatsapp information</div>
    </Card.Session>
  );
}

WhatsappSettingMenu.propTypes = {
  whatsappSettingUrl: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'settingPageMenu',
  sortOrder: 10
};

export const query = `
  query Query {
    whatsappSettingUrl: url(routeId: "whatsappSetting")
  }
`;
