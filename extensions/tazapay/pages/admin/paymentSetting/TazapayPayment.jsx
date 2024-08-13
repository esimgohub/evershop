import PropTypes from 'prop-types';
import React from 'react';
import { Field } from '@components/common/form/Field';
import { Toggle } from '@components/common/form/fields/Toggle';
import { Card } from '@components/admin/cms/Card';

export default function TazapayPayment({
  setting: {
    tazapayPaymentStatus,
    tazapayDislayName,
    tazapayPublishableKey,
    tazapaySecretKey,
    tazapayEndpointSecret
  }
}) {
  return (
    <Card title="Tazapay Payment">
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Enable?</h4>
          </div>
          <div className="col-span-2">
            <Toggle name="tazapayPaymentStatus" value={tazapayPaymentStatus} />
          </div>
        </div>
      </Card.Session>
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Dislay Name</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="tazapayDislayName"
              placeholder="Dislay Name"
              value={tazapayDislayName}
            />
          </div>
        </div>
      </Card.Session>
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Publishable Key</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="tazapayPublishableKey"
              placeholder="Publishable Key"
              value={tazapayPublishableKey}
            />
          </div>
        </div>
      </Card.Session>
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Access Key</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="tazapayAccessKey"
              placeholder="Access Key"
              value={tazapayPublishableKey}
            />
          </div>
        </div>
      </Card.Session>
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Secret Key</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="tazapaySecretKey"
              placeholder="Secret Key"
              value={tazapaySecretKey}
            />
          </div>
        </div>
      </Card.Session>
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Webhook Secret Key</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="tazapayEndpointSecret"
              placeholder="Webhook Secret Key"
              value={tazapayEndpointSecret}
            />
          </div>
        </div>
      </Card.Session>
    </Card>
  );
}

TazapayPayment.propTypes = {
  setting: PropTypes.shape({
    tazapayPaymentStatus: PropTypes.bool,
    tazapayDislayName: PropTypes.string,
    tazapayPublishableKey: PropTypes.string,
    tazapaySecretKey: PropTypes.string,
    tazapayAccessKey: PropTypes.string,
    tazapayEndpointSecret: PropTypes.string
  }).isRequired
};

export const layout = {
  areaId: 'paymentSetting',
  sortOrder: 0
};

export const query = `
  query Query {
    setting {
      tazapayDislayName
      tazapayPaymentStatus
      tazapayPublishableKey
      tazapaySecretKey
      tazapayAccessKey
      tazapayEndpointSecret
    }
  }
`;
