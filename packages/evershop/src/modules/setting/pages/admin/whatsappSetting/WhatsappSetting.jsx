import PropTypes from 'prop-types';
import React from 'react';
import { Field } from '@components/common/form/Field';
import { Card } from '@components/admin/cms/Card';
import { toast } from 'react-toastify';
import { Form } from '@components/common/form/Form';
import SettingMenu from '@components/admin/setting/SettingMenu';
function WhatsappSettingForm(props) {
  const { config } = props;

  const { whatsapp } = config;
  const { phoneNumber } = whatsapp;

  return (
    <Card title="Basic Information" className="mb-2" actions={[]}>
      <Card.Session>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 items-center flex">
            <h4>Phone Number</h4>
          </div>

          <Field
            type="text"
            name={`whatsappPhoneNumber`}
            placeholder="Example: 1231412311"
            value={phoneNumber}
          />
        </div>
      </Card.Session>
    </Card>
  );
}
export default function WhatsappSetting(props) {
  const { saveSettingApi, config } = props;

  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-2 grid-flow-row ">
        <div className="col-span-2">
          <SettingMenu />
        </div>

        <div className="col-span-4">
          <Form
            id="whatsapp-setting-form"
            method="POST"
            action={saveSettingApi}
            onSuccess={(response) => {
              if (!response.error) {
                toast.success('Setting saved');
              } else {
                toast.error(response.error.message);
              }
            }}
          >
            <WhatsappSettingForm config={config} />
          </Form>
        </div>
      </div>
    </div>
  );
}

WhatsappSetting.propTypes = {
  config: {
    whatsapp: {
      phoneNumber: PropTypes.string
    }
  }
};

export const layout = {
  areaId: 'content',
  sortOrder: 14
};

export const query = `
  query Query {
    saveSettingApi: url(routeId: "saveSetting")
    config {
      whatsapp {
        phoneNumber
      }
    }
  }
`;
