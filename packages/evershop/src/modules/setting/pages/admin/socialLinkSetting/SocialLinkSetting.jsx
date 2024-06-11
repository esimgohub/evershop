import PropTypes from 'prop-types';
import React from 'react';
import { Field } from '@components/common/form/Field';
import { Toggle } from '@components/common/form/fields/Toggle';
import { Card } from '@components/admin/cms/Card';

export default function SocialLink({
  setting: {
    socialLinkStatus,
    facebookLink,
    googleLink,
    xKey,
    threadLink,
    adyenHmacKey
  }
}) {
  return (
    <Card title="Adyen Payment">
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Facebook</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="facebookLink"
              placeholder="Facebook N"
              value={facebookLink}
            />
          </div>
        </div>
      </Card.Session>

      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Google</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="googleLink"
              placeholder="Google"
              value={googleLink}
            />
          </div>
        </div>
      </Card.Session>

      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>X</h4>
          </div>
          <div className="col-span-2">
            <Field type="text" name="xKey" placeholder="X" value={xKey} />
          </div>
        </div>
      </Card.Session>

      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Thread</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="threadLink"
              placeholder="Thread"
              value={threadLink}
            />
          </div>
        </div>
      </Card.Session>
    </Card>
  );
}

SocialLink.propTypes = {
  setting: PropTypes.shape({
    socialLinkStatus: PropTypes.bool,
    facebookLink: PropTypes.string,
    xKey: PropTypes.string,
    googleLink: PropTypes.string
  }).isRequired
};

export const layout = {
  areaId: 'paymentSetting',
  sortOrder: 5
};

export const query = `
  query Query {
    setting {
      facebookLink
      googleLink
      threadLink
      xKey
    }
  }
`;
