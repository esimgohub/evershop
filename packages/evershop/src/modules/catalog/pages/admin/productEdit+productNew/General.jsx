import PropTypes from 'prop-types';
import React from 'react';
import Area from '@components/common/Area';
import { Field } from '@components/common/form/Field';
import { Card } from '@components/admin/cms/Card';
import CkeditorField from '@components/common/form/fields/Ckeditor';
import CategoryTree from '@components/admin/catalog/productEdit/category/CategoryTree';
import { ProductType } from '../../../utils/enums/product-type';
import { Select } from '@components/common/form/fields/Select';

function SKUPrice({ sku, price, oldPrice, productType, setting }) {
  return (
    <div
      className={`grid grid-cols-${
        !productType ||
        (productType && productType === ProductType.variable.value)
          ? '1'
          : '3'
      } gap-1 mt-15`}
    >
      <div>
        <Field
          id="sku"
          name="sku"
          value={sku}
          placeholder="SKU"
          label="SKU"
          type="text"
          validationRules={['notEmpty']}
        />
      </div>

      {productType && productType === ProductType.simple.value && (
        <div>
          <Field
            id="price"
            name="price"
            value={price?.value}
            placeholder="Price"
            label="Price"
            type="text"
            validationRules={['notEmpty']}
            suffix={setting.storeCurrency}
          />
        </div>
      )}

      {productType && productType === ProductType.simple.value && (
        <div>
          <Field
            id="oldPrice"
            name="old_price"
            value={oldPrice?.value}
            placeholder="Old Price"
            label="Old Price"
            type="text"
            suffix={setting.storeCurrency}
          />
        </div>
      )}
    </div>
  );
}

SKUPrice.propTypes = {
  price: PropTypes.number,
  oldPrice: PropTypes.number,
  sku: PropTypes.string,
  setting: PropTypes.shape({
    storeCurrency: PropTypes.string
  }).isRequired
};

SKUPrice.defaultProps = {
  price: undefined,
  oldPrice: undefined,
  sku: undefined
};

function Category({ product }) {
  const [selecting, setSelecting] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [modifiedCategories, setModifiedCategories] = React.useState(
    product ? product.categories : []
  );

  return (
    <div className="mt-15 relative">
      <div className="mb-1">Categories</div>
      {modifiedCategories.length !== 0 && (
        <div className="border rounded border-[#c9cccf] mb-1 p-1">
          {modifiedCategories.map((category, index) => (
            <div>
              {category.path.map((item, index) => (
                <span key={item.name} className="text-gray-500">
                  {item.name}
                  {index < category.path.length - 1 && ' > '}
                </span>
              ))}
              <span className="text-interactive pl-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  Change
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();

                    if (modifiedCategories.length !== 0) {
                      setModifiedCategories(
                        modifiedCategories.filter(
                          (cat) => cat.uuid !== category.uuid
                        )
                      );
                    }
                  }}
                  className="text-critical ml-2"
                >
                  Unassign
                </a>
              </span>
            </div>
          ))}
        </div>
      )}

      {!selecting && (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setSelecting(!selecting);
          }}
          className="text-interactive"
        >
          Select categories
        </a>
      )}

      {selecting && (
        <div className="absolute top-5 left-0 right-0 bg-[#eff2f5] z-50 border rounded border-[#c9cccf] p-[10px]">
          <CategoryTree
            selectedCategory={selectedCategory}
            setSelectedCategory={(cat) => {
              setSelectedCategory(cat);
              setModifiedCategories([...modifiedCategories, cat]);
              setSelecting(false);
            }}
          />
        </div>
      )}

      {modifiedCategories.length !== 0 && (
        <input
          type="hidden"
          name="category_ids"
          value={modifiedCategories.map((category, index) => category.uuid)}
        />
      )}
    </div>
  );
}

Category.propTypes = {
  product: PropTypes.shape({
    categories: PropTypes.shape({
      categoryId: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      uuid: PropTypes.string.isRequired,
      path: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired
        })
      ).isRequired
    })
  })
};

Category.defaultProps = {
  product: {
    categories: []
  }
};

export default function General({
  product,
  browserApi,
  deleteApi,
  uploadApi,
  folderCreateApi,
  setting,
  productTaxClasses: { items: taxClasses }
}) {
  return (
    <Card title="General">
      <Card.Session>
        <Area
          id="productEditGeneral"
          coreComponents={[
            (!product ||
              (product && product.type === ProductType.variable.value)) && {
              component: { default: Field },
              props: {
                id: 'name',
                name: 'name',
                label: 'Name',
                value: product?.name,
                validationRules: ['notEmpty'],
                type: 'text',
                placeholder: 'Name'
              },
              sortOrder: 10,
              id: 'name'
            },
            {
              component: { default: Field },
              props: {
                id: 'product_id',
                name: 'product_id',
                value: product?.productId,
                type: 'hidden'
              },
              sortOrder: 10,
              id: 'product_id'
            },
            {
              component: { default: SKUPrice },
              props: {
                sku: product?.sku,
                price: product?.price.regular,
                oldPrice: product?.price.oldPrice,
                productType: product?.type,
                setting
              },
              sortOrder: 20,
              id: 'SKUPrice'
            },
            (!product ||
              (product && product.type === ProductType.variable.value)) && {
              component: { default: Category },
              props: {
                name: 'category_ids',
                product
              },
              sortOrder: 22,
              id: 'category_ids'
            },
            {
              component: { default: Select },
              props: {
                name: 'type',
                label: 'Product Type',
                placeholder: 'Select product type',
                value:
                  product && product.type
                    ? product.type
                    : ProductType.variable.value,
                disabled: true,
                options: [
                  {
                    text: ProductType.simple.label,
                    value: ProductType.simple.value
                  },
                  {
                    text: ProductType.variable.label,
                    value: ProductType.variable.value
                  }
                ]
              },
              id: 'type',
              sortOrder: 24
            },
            (!product ||
              (product && product.type === ProductType.variable.value)) && {
              component: { default: Field },
              props: {
                id: 'tax_class',
                name: 'tax_class',
                value: product?.taxClass || null,
                type: 'select',
                label: 'Tax class',
                options: [...taxClasses],
                placeholder: 'None',
                disableDefaultOption: false
              },
              sortOrder: 25,
              id: 'tax_class'
            },
            (!product ||
              (product && product.type === ProductType.variable.value)) && {
              component: { default: CkeditorField },
              props: {
                id: 'description',
                name: 'description',
                label: 'Description',
                value: product?.description,
                browserApi,
                deleteApi,
                uploadApi,
                folderCreateApi
              },
              sortOrder: 30,
              id: 'description'
            }
          ]}
        />
      </Card.Session>
    </Card>
  );
}

General.propTypes = {
  browserApi: PropTypes.string.isRequired,
  deleteApi: PropTypes.string.isRequired,
  folderCreateApi: PropTypes.string.isRequired,
  uploadApi: PropTypes.string.isRequired,
  product: PropTypes.shape({
    description: PropTypes.string,
    name: PropTypes.string,
    price: PropTypes.shape({
      regular: PropTypes.shape({
        currency: PropTypes.string,
        value: PropTypes.number
      })
    }),
    productId: PropTypes.string,
    taxClass: PropTypes.number,
    sku: PropTypes.string
  }),
  setting: PropTypes.shape({
    storeCurrency: PropTypes.string
  }).isRequired,
  productTaxClasses: PropTypes.shape({
    items: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.number,
        text: PropTypes.string
      })
    )
  })
};

General.defaultProps = {
  product: undefined,
  productTaxClasses: {
    items: []
  }
};

export const layout = {
  areaId: 'leftSide',
  sortOrder: 10
};

export const query = `
  query Query {
    product(id: getContextValue("productId", null)) {
      productId
      name
      description
      sku
      parentProductId
      taxClass
      type
      price {
        regular {
          value
          currency
        }
        oldPrice {
          value
          currency
        }
      }
      categories {
        categoryId
        name
        uuid
        status
        path {
          name
        }
      }
    }
    setting {
      storeCurrency
    }
    browserApi: url(routeId: "fileBrowser", params: [{key: "0", value: ""}])
    deleteApi: url(routeId: "fileDelete", params: [{key: "0", value: ""}])
    uploadApi: url(routeId: "imageUpload", params: [{key: "0", value: ""}])
    folderCreateApi: url(routeId: "folderCreate")
    productTaxClasses: taxClasses {
      items {
        value: taxClassId
        text: name
      }
    }
  }
`;
