import PropTypes from 'prop-types';
import React from 'react';
import { Field } from '@components/common/form/Field';
import { Toggle } from '@components/common/form/fields/Toggle';
import { Card } from '@components/admin/cms/Card';

export default function AdyenPayment({
  setting: {
    adyenPaymentStatus,
    adyenDislayName,
    adyenApiKey,
    adyenClientKey,
    adyenMerchantAccount,
    adyenHmacKey
  }
}) {
  return (
    <Card title="Adyen Payment">
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Enable?</h4>
          </div>
          <div className="col-span-2">
            <Toggle
              name="adyenPaymentStatus"
              value={adyenPaymentStatus || ''}
            />
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
              name="adyenDislayName"
              placeholder="Dislay Name"
              value={adyenDislayName}
            />
          </div>
        </div>
      </Card.Session>
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>API key</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="adyenApiKey"
              placeholder="API key"
              value={adyenApiKey}
            />
          </div>
        </div>
      </Card.Session>
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Client key</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="adyenClientKey"
              placeholder="Client key"
              value={adyenClientKey}
            />
          </div>
        </div>
      </Card.Session>
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Merchant account</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="adyenMerchantAccount"
              placeholder="Merchant account"
              value={adyenMerchantAccount}
            />
          </div>
        </div>
      </Card.Session>
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 flex items-center">
            <h4>HMAC key (Webhook)</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="adyenHmacKey"
              placeholder="HMAC key"
              value={adyenHmacKey || ''}
            />
          </div>
        </div>
      </Card.Session>
    </Card>
  );
}

AdyenPayment.propTypes = {
  setting: PropTypes.shape({
    adyenPaymentStatus: PropTypes.bool,
    adyenDislayName: PropTypes.string,
    adyenClientKey: PropTypes.string,
    adyenApiKey: PropTypes.string,
    adyenSecretKey: PropTypes.string,
    adyenHmacKey: PropTypes.string
  }).isRequired
};

export const layout = {
  areaId: 'paymentSetting',
  sortOrder: 5
};

export const query = `
  query Query {
    setting {
      adyenDislayName
      adyenPaymentStatus
      adyenApiKey
      adyenHmacKey
      adyenMerchantAccount
      adyenClientKey
    }
  }
`;
