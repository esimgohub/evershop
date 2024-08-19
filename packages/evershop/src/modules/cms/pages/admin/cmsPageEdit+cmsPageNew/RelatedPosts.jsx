import PropTypes from 'prop-types';
import React from 'react';
import { Field } from '@components/common/form/Field';
import { Card } from '@components/admin/cms/Card';

export default function RelatedPosts({ cmsPage }) {
  return <Card />;
}

RelatedPosts.propTypes = {
  cmsPage: PropTypes.shape({
    status: PropTypes.number,
    includeInNave: PropTypes.number,
    layout: PropTypes.string.isRequired
  })
};

RelatedPosts.defaultProps = {
  cmsPage: null
};

export const layout = {
  areaId: 'rightSide',
  sortOrder: 15
};

export const query = `
  query Query {
    cmsPage(id: getContextValue("cmsPageId", null)) {
      status
      layout
    }
  }
`;
