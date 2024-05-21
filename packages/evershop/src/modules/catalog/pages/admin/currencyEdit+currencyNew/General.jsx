import PropTypes from 'prop-types';
import React from 'react';
import Area from '@components/common/Area';
import { get } from '@evershop/evershop/src/lib/util/get';
import { Field } from '@components/common/form/Field';
import { Card } from '@components/admin/cms/Card';

export default function General(props) {
  const {
    getCurrency: currency,
    browserApi,
    deleteApi,
    uploadApi,
    folderCreateApi
  } = props;

  const fields = [
    {
      component: { default: Field },
      props: {
        id: 'code',
        name: 'code',
        label: 'Currency Code',
        validationRules: ['notEmpty'],
        placeholder: 'USD',
        type: 'text'
      },
      sortOrder: 10,
      id: 'code'
    },
    {
      component: { default: Field },
      props: {
        id: 'rate',
        name: 'rate',
        label: 'Rate',
        validationRules: ['notEmpty'],
        placeholder: '1.0',
        type: 'text'
      },
      sortOrder: 15,
      id: 'rate'
    },
    {
      component: { default: Field },
      props: {
        id: 'signature',
        name: 'signature',
        label: 'Signature',
        validationRules: ['notEmpty'],
        placeholder: '$',
        type: 'text'
      },
      sortOrder: 15,
      id: 'signature'
    },
    {
      component: { default: Field },
      props: {
        id: 'id',
        name: 'id',
        type: 'hidden'
      },
      sortOrder: 10
    }
  ].map((f) => {
    if (get(currency, `${f.props.id}`) !== undefined) {
      // eslint-disable-next-line no-param-reassign
      f.props.value = get(currency, `${f.props.id}`);
    }
    return f;
  });

  return (
    <Card title="General">
      <Card.Session>
        <Area id="currencyEditGeneral" coreComponents={fields} />
      </Card.Session>
    </Card>
  );
}

General.propTypes = {
  browserApi: PropTypes.string.isRequired,
  deleteApi: PropTypes.string.isRequired,
  folderCreateApi: PropTypes.string.isRequired,
  uploadApi: PropTypes.string.isRequired,
  getCurrency: PropTypes.shape({
    id: PropTypes.string,
    code: PropTypes.string,
    rate: PropTypes.number,
    signature: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string
  })
};

General.defaultProps = {
  getCurrency: {}
};

export const layout = {
  areaId: 'currencyFormInner',
  sortOrder: 10
};

export const query = `
  query Query {
    getCurrency(id: getContextValue("currencyId", null)) {
      id
      code
      rate
      signature
      createdAt
      updatedAt
    }
    browserApi: url(routeId: "fileBrowser", params: [{key: "0", value: ""}])
    deleteApi: url(routeId: "fileDelete", params: [{key: "0", value: ""}])
    uploadApi: url(routeId: "imageUpload", params: [{key: "0", value: ""}])
    folderCreateApi: url(routeId: "folderCreate")
  }
`;
