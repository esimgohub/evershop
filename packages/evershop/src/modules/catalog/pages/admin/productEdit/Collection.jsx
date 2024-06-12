import PropTypes from 'prop-types';
import React from 'react';
import CollectionIcon from '@heroicons/react/solid/esm/TagIcon';
import { Card } from '@components/admin/cms/Card';
import { ProductType } from '../../../utils/enums/product-type';

export default function Collections({ product: { type, collections } }) {
  const isVariableProduct = type === ProductType.variable.value;
  if (isVariableProduct) {
    return null;
  }

  return (
    <Card title="Collections" subdued>
      <Card.Session>
        {collections.map((collection) => (
          <div className="flex justify-start gap-1 items-center align-middle">
            <CollectionIcon width={16} height={16} fill="#2c6ecb" />
            <a href={collection.editUrl} className="hover:underline">
              <span>{collection.name}</span>
            </a>
          </div>
        ))}
        {collections.length === 0 && (
          <div className="text-gray-500">No collections</div>
        )}
      </Card.Session>
    </Card>
  );
}

Collections.propTypes = {
  product: PropTypes.shape({
    type: PropTypes.string.isRequired,
    collections: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired
      })
    )
  })
};

Collections.defaultProps = {
  product: {
    type: '',
    collections: []
  }
};

export const layout = {
  areaId: 'rightSide',
  sortOrder: 15
};

export const query = `
  query Query {
    product(id: getContextValue("productId", null)) {
      type
      collections {
        name
        editUrl
      }
    }
  }
`;
