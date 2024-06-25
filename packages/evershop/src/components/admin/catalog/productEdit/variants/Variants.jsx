import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from 'urql';
import { Card } from '@components/admin/cms/Card';
import { CreateVariant } from '@components/admin/catalog/productEdit/variants/CreateVariant';
import Spinner from '@components/common/Spinner';
import { Variant } from '@components/admin/catalog/productEdit/variants/Variant';

export const VariantQuery = `
query Query($productId: ID!) {
  product(id: $productId) {
    variantGroup {
      items {
        id
        attributes {
          attributeId
          attributeCode
          optionId
          optionText
        }
        product {
          productId
          uuid
          name
          sku
          status
          visibility
          price {
            regular {
              value
              currency
              text
            }
            oldPrice {
              value
              currency
              text
            }
          }
          editUrl
          updateApi
          image {
            uuid
            url
          }
          gallery {
            uuid
            url
          }
        }
      }
    }
  }
}
`;

export function Variants({
  productId,
  productUuid,
  variantGroup,
  variantAttributes,
  createProductApi,
  addVariantItemApi,
  productImageUploadUrl
}) {
  const [result, reexecuteQuery] = useQuery({
    query: VariantQuery,
    variables: {
      productId
    }
  });

  const refresh = () => {
    reexecuteQuery({ requestPolicy: 'network-only' });
  };

  const { data, fetching, error } = result;
  if (fetching) {
    return (
      <div className="p-3 flex justify-center items-center border rounded border-divider">
        <Spinner width={30} height={30} />
      </div>
    );
  }

  if (error) {
    return (
      <p>
        Oh no...
        {error.message}
      </p>
    );
  }

  return (
    <Card.Session>
      <div className="variant-list overflow-x-scroll">
        <table>
          <thead>
            <tr className="[&>th]:text-center [&>th]:min-w-[140px]">
              <th>SKU</th>
              <th>Status</th>
              {variantAttributes.map((attribute) => (
                <th key={attribute.attributeId}>{attribute.attributeName}</th>
              ))}
              <th>Price</th>
              <th>Old Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data.product.variantGroup?.items || [])
              .filter((v) => v.product.productId !== productId)
              .map((v) => (
                <Variant
                  key={v.id}
                  variant={v}
                  attributes={variantAttributes}
                  productImageUploadUrl={productImageUploadUrl}
                  refresh={refresh}
                  variantGroup={variantGroup}
                />
              ))}
          </tbody>
        </table>
      </div>
      <div className="self-center">
        <CreateVariant
          productId={productId}
          productUuid={productUuid}
          variantGroup={variantGroup}
          createProductApi={createProductApi}
          addVariantItemApi={addVariantItemApi}
          productImageUploadUrl={productImageUploadUrl}
          refresh={refresh}
        />
      </div>
    </Card.Session>
  );
}

Variants.propTypes = {
  variantAttributes: PropTypes.arrayOf(
    PropTypes.shape({
      attributeName: PropTypes.string,
      attributeId: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          optionId: PropTypes.number,
          optionText: PropTypes.string
        })
      )
    })
  ).isRequired,
  productId: PropTypes.number.isRequired,
  productUuid: PropTypes.string.isRequired,
  variantGroup: PropTypes.shape({
    attributes: PropTypes.arrayOf(
      PropTypes.shape({
        attributeName: PropTypes.string,
        attributeId: PropTypes.string.isRequired,
        attributeType: PropTypes.string.isRequired,
        attributeValues: PropTypes.arrayOf(
          PropTypes.shape({
            attributeValueId: PropTypes.string.isRequired,
            attributeValueName: PropTypes.string.isRequired
          })
        )
      })
    )
  }),
  createProductApi: PropTypes.string.isRequired,
  addVariantItemApi: PropTypes.string.isRequired,
  productImageUploadUrl: PropTypes.string.isRequired
};

Variants.defaultProps = {
  variantGroup: null
};
