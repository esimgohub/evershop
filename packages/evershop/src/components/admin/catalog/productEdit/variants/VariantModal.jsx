/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from 'urql';
import ProductMediaManager from '@components/admin/catalog/productEdit/media/ProductMediaManager';
import { Field } from '@components/common/form/Field';
import { useFormContext } from '@components/common/form/Form';
import Spinner from '@components/common/Spinner';
import { ProductType } from '@evershop/evershop/src/modules/catalog/utils/enums/product-type';

const AttributesQuery = `
  query Query($filters: [FilterInput]) {
    attributes(filters: $filters) {
      items {
        attributeId
        attributeCode
        attributeName
        options {
          value: attributeOptionId
          text: optionText
        }
      }
    }
  }
`;

export function VariantModal({
  productId,
  productUuid,
  variant,
  variantAttributes,
  productImageUploadUrl
}) {
  console.log('variant product', variant?.product);

  const formContext = useFormContext();
  const image = variant?.product?.image;
  let gallery = variant?.product?.gallery || [];

  if (image) {
    gallery = [image].concat(gallery);
  }
  const [result] = useQuery({
    query: AttributesQuery,
    variables: {
      filters: [
        {
          key: 'code',
          operation: 'in',
          value: variantAttributes.map((a) => a.attributeCode).join(',')
        }
      ]
    }
  });

  const { data, fetching, error } = result;
  if (fetching) {
    return (
      <div className="p-3 flex justify-center items-center border rounded border-divider">
        <Spinner width={30} height={30} />
      </div>
    );
  }

  if (error) {
    return <p className="text-critical">{error.message}</p>;
  }
  return (
    <div className="variant-item pb-15 border-b border-solid border-divider mb-15 last:border-b-0 last:pb-0">
      <div className="grid grid-cols-1">
        {/* <div className="col-span-1">
          <ProductMediaManager
            id="images"
            productImageUploadUrl={productImageUploadUrl}
            productImages={gallery}
          />
        </div> */}
        <div className="col-span-1">
          <div className="grid grid-cols-2 gap-x-1 border-b border-divider pb-15 mb-15">
            {data?.attributes?.items.map((a, index) => (
              <div key={a.attributeId} className="mt-1 col">
                <div>
                  <label>{a.attributeName}</label>
                </div>
                <input
                  type="hidden"
                  name={`attributes[${index}][attribute_code]`}
                  value={a.attributeCode}
                />
                <input
                  type="hidden"
                  name={a.attributeCode}
                  value={
                    formContext.fields.find(
                      (f) => f.name === `attributes[${index}][value]`
                    )?.value
                  }
                />
                <Field
                  name={`attributes[${index}][value]`}
                  validationRules={['notEmpty']}
                  value={
                    variant?.attributes.find(
                      (v) => v.attributeCode === a.attributeCode
                    )?.optionId
                  }
                  options={a.options}
                  type="select"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-x-1 border-b border-divider pb-15 mb-15">
            <div>
              <div>SKU</div>
              <Field
                name="sku"
                formId="product-edit-form"
                validationRules={['notEmpty']}
                value={variant?.product?.sku}
                type="text"
              />
            </div>
            <div>
              <div>Price</div>
              <Field
                name="price"
                formId="product-edit-form"
                validationRules={['notEmpty']}
                value={variant?.product?.price?.regular?.value}
                type="text"
              />
            </div>
            <div>
              <div>Old Price</div>
              <Field
                name="old_price"
                formId="product-edit-form"
                value={variant?.product?.price?.oldPrice?.value}
                type="text"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-x-1">
            <div>
              <div>Status</div>
              <Field
                name="status"
                formId="product-edit-form"
                value={variant?.product?.status}
                type="toggle"
              />
            </div>
            <div>
              <div>Visibility</div>
              <Field
                name="visibility"
                formId="product-edit-form"
                value={variant?.product?.visibility}
                type="toggle"
              />
            </div>
          </div>
          <Field
            name="parent_product_id"
            formId="product-edit-form"
            value={productId}
            type="hidden"
          />
          <Field
            name="parent_product_uuid"
            formId="product-edit-form"
            value={productUuid}
            type="hidden"
          />
          <Field
            name="type"
            formId="product-edit-form"
            value={ProductType.simple.value}
            type="hidden"
          />
        </div>
      </div>
    </div>
  );
}

VariantModal.propTypes = {
  variant: PropTypes.shape({
    product: PropTypes.shape({
      image: PropTypes.string,
      gallery: PropTypes.arrayOf(PropTypes.string),
      sku: PropTypes.string,
      inventory: PropTypes.shape({
        qty: PropTypes.number
      }),
      status: PropTypes.number,
      visibility: PropTypes.number,
      attributes: PropTypes.arrayOf(
        PropTypes.shape({
          attributeCode: PropTypes.string,
          optionId: PropTypes.number
        })
      )
    }),
    attributes: PropTypes.arrayOf(
      PropTypes.shape({
        attributeCode: PropTypes.string,
        optionId: PropTypes.number
      })
    )
  }),
  variantAttributes: PropTypes.arrayOf(
    PropTypes.shape({
      attributeId: PropTypes.number,
      attributeName: PropTypes.string,
      attributeCode: PropTypes.string,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          optionId: PropTypes.number,
          optionText: PropTypes.string
        })
      )
    })
  ),
  productImageUploadUrl: PropTypes.string.isRequired
};

VariantModal.defaultProps = {
  variant: null,
  variantAttributes: []
};
