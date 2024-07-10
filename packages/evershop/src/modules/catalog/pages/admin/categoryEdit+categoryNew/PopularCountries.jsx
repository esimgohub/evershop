import PropTypes from 'prop-types';
import React from 'react';
import { Field } from '@components/common/form/Field';
import { Card } from '@components/admin/cms/Card';

export default function Status({ category }) {
  return (
    <Card>
      <Card.Session title="Is Popular">
        <Field
          type="radio"
          name="is_popular"
          options={[
            { value: 0, text: 'No' },
            { value: 1, text: 'Yes' }
          ]}
          value={category?.isPopular === undefined ? 1 : category.isPopular}
        />
      </Card.Session>
    </Card>
  );
}

Status.propTypes = {
  category: PropTypes.shape({
    isPopular: PropTypes.bool
  })
};

Status.defaultProps = {
  category: {}
};

export const layout = {
  areaId: 'rightSide',
  sortOrder: 15
};

export const query = `
  query Query {
    category(id: getContextValue("categoryId", null)) {
      isPopular
    }
  }
`;
