const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { select } = require('@evershop/postgres-query-builder');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { createAttribute } = require('@evershop/evershop/src/modules/oms/services/getAdditionalOrderInfo');
const { toPrice } = require('../toPrice');
const {
  calculateTaxAmount
} = require('../../../tax/services/calculateTaxAmount');
const { getSetting } = require('../../../setting/services/setting');
const { getTaxPercent } = require('../../../tax/services/getTaxPercent');
const { getTaxRates } = require('../../../tax/services/getTaxRates');

module.exports.registerCartItemBaseFields =
  function registerCartItemBaseFields() {
    return [
      {
        key: 'cart_item_id',
        resolvers: [
          async function resolver() {
            return this.getData('cart_item_id');
          }
        ]
      },
      {
        key: 'is_active',
        resolvers: [
          async function resolver() {
            const triggeredField = this.getTriggeredField();
            const requestedValue = this.getRequestedValue();
            return triggeredField === 'is_active' ? requestedValue : this.getData('is_active');
          }
        ]
      },
      {
        key: 'uuid',
        resolvers: [
          async function resolver() {
            return this.getData('uuid') ?? uuidv4();
          }
        ]
      },
      {
        key: 'cart_id',
        resolvers: [
          async function resolver() {
            const cart = this.getCart();
            return cart.getData('cart_id');
          }
        ],
        dependencies: ['cart_item_id']
      },
      {
        key: 'product_id',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            if (product.status === false) {
              this.setError('product_id', 'This product is not available');
            }
            return product.product_id;
          }
        ]
      },
      {
        key: 'product_uuid',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            return product.uuid;
          }
        ]
      },
      {
        key: 'product_sku',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            return product.sku;
          }
        ]
      },
      {
        key: 'group_id',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            return parseInt(product.group_id, 10) ?? null;
          }
        ],
        dependencies: ['product_id']
      },
      // {
      //   key: 'category_id',
      //   resolvers: [
      //     async function resolver(category_id) {
      //     const dummy= category_id
      //       const product = await this.getProduct();
      //       return product.category_id
      //         ? parseInt(product.category_id, 10)
      //         : null;
      //     }
      //   ],
      //   dependencies: ['product_id']
      // },
      {
        key: 'product_name',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            return product.name ?? null;
          }
        ],
        dependencies: ['product_id']
      },
      {
        key: 'thumbnail',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            if (product.thumb_image) {
              return product.thumb_image;
            } else {
              return null;
            }
          }
        ],
        dependencies: ['product_id']
      },
      {
        key: 'product_weight',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            return parseFloat(product.weight) ?? null;
          }
        ],
        dependencies: ['product_id']
      },
      {
        key: 'product_price',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            return toPrice(product.price);
          }
        ],
        dependencies: ['product_id']
      },
      {
        key: 'product_price_incl_tax',
        resolvers: [
          async function resolver() {
            const taxAmount = calculateTaxAmount(
              this.getData('tax_percent'),
              this.getData('product_price'),
              1
            );
            return toPrice(this.getData('product_price')) + taxAmount;
          }
        ],
        dependencies: ['product_price', 'tax_percent']
      },
      {
        key: 'qty',
        resolvers: [
          async function resolver() {
            const triggeredField = this.getTriggeredField();
            const requestedValue = this.getRequestedValue();
            const qty =
              triggeredField === 'qty' ? requestedValue : this.getData('qty');
            const product = await this.getProduct();
            if (product.manage_stock === true && product.qty < 1) {
              this.setError('qty', 'This item is out of stock');
            } else if (product.manage_stock === true && product.qty < qty) {
              this.setError('qty', 'We do not have enough stock');
            }

            return parseInt(qty, 10) ?? null;
          }
        ]
      },
      {
        key: 'final_price',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            return toPrice(product.price);

            // return toPrice(productPrice.price); // TODO This price should include the custom option price
            // const product = await this.getProduct();
            // return toPrice(product.price);
          }
        ],
        dependencies: ['product_id']
      },
      {
        key: 'final_price_incl_tax',
        resolvers: [
          async function resolver() {
            const taxAmount = calculateTaxAmount(
              this.getData('tax_percent'),
              this.getData('final_price'),
              1
            );
            return toPrice(this.getData('final_price')) + taxAmount;
          }
        ],
        dependencies: ['final_price', 'tax_percent']
      },
      {
        key: 'sub_total',
        resolvers: [
          async function resolver() {
            return toPrice(this.getData('final_price') * this.getData('qty'));
          }
        ],
        dependencies: ['final_price', 'qty']
      },
      {
        key: 'total',
        resolvers: [
          async function resolver() {
            return toPrice(
              this.getData('final_price') * this.getData('qty') +
              this.getData('tax_amount')
            );
          }
        ],
        dependencies: ['final_price', 'qty', 'tax_amount']
      },
      {
        key: 'tax_class_id',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            return product.tax_class ?? null;
          }
        ],
        dependencies: ['product_id']
      },
      {
        key: 'tax_percent',
        resolvers: [
          async function resolver() {
            if (!this.getData('tax_class_id')) {
              return 0;
            } else {
              const taxClass = await select()
                .from('tax_class')
                .where('tax_class_id', '=', this.getData('tax_class_id'))
                .load(pool);
              if (!taxClass) {
                return 0;
              } else {
                const baseCalculationAddress = await getSetting(
                  'baseCalculationAddress',
                  'shippingAddress'
                );
                if (baseCalculationAddress === 'storeAddress') {
                  const percentage = getTaxPercent(
                    await getTaxRates(
                      this.getData('tax_class_id'),
                      await getSetting('storeCountry', null),
                      await getSetting('storeProvince', null),
                      await getSetting('storePostalCode', null)
                    )
                  );
                  return percentage;
                } else {
                  const cart = this.getCart();
                  const addressId =
                    baseCalculationAddress === 'billingAddress'
                      ? cart.getData('billing_address_id')
                      : cart.getData('shipping_address_id');

                  if (!addressId) {
                    return 0;
                  } else {
                    const address = await select()
                      .from('cart_address')
                      .where('cart_address_id', '=', addressId)
                      .load(pool);
                    if (!address) {
                      return 0;
                    } else {
                      const percentage = getTaxPercent(
                        await getTaxRates(
                          this.getData('tax_class_id'),
                          address.country,
                          address.province,
                          address.postcode
                        )
                      );
                      return percentage;
                    }
                  }
                }
              }
            }
          }
        ],
        dependencies: ['cart_id', 'tax_class_id']
      },
      {
        key: 'tax_amount',
        resolvers: [
          async function resolver() {
            const discountAmount = this.getData('discount_amount');
            const finalPrice = this.getData('final_price');

            // The discount amount is total (all quantity), we need to Get the final price after discount per unit
            const finalPricePerUnit =
              finalPrice - discountAmount / this.getData('qty');
            return calculateTaxAmount(
              this.getData('tax_percent'),
              finalPricePerUnit,
              this.getData('qty')
            );
          }
        ],
        dependencies: ['tax_percent', 'final_price', 'qty', 'discount_amount']
      },
      {
        key: 'variant_group_id',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            return product.variant_group_id ?? null;
          }
        ],
        dependencies: ['product_id']
      },
      {
        key: 'variant_options',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            if (product.variant_group_id) {
              const group = await select('attribute_one')
                .select('attribute_two')
                .select('attribute_three')
                .select('attribute_four')
                .select('attribute_five')
                .from('variant_group')
                .where('variant_group_id', '=', product.variant_group_id)
                .load(pool);
              if (!group) {
                return null;
              } else {
                const query = select('a.attribute_code')
                  .select('a.attribute_name')
                  .select('a.attribute_id')
                  .select('o.option_id')
                  .select('o.option_text')
                  .from('attribute', 'a');
                query
                  .innerJoin('product_attribute_value_index', 'o')
                  .on('a.attribute_id', '=', 'o.attribute_id');
                query.where('o.product_id', '=', product.product_id).and(
                  'a.attribute_id',
                  'IN',
                  Object.values(group).filter((v) => v != null)
                );

                return JSON.stringify(await query.execute(pool));
              }
            } else {
              return null;
            }
          }
        ],
        dependencies: ['variant_group_id']
      },
      {
        key: 'productUrl',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            if (!this.getData('product_id')) {
              return null;
            }
            const urlRewrite = await select()
              .from('url_rewrite')
              .where('entity_uuid', '=', product.uuid)
              .and('entity_type', '=', 'product')
              .load(pool);
            if (!urlRewrite) {
              return buildUrl('productView', {
                uuid: product.uuid
              });
            } else {
              return urlRewrite.request_path;
            }
          }
        ],
        dependencies: ['product_id']
      },
      {
        key: 'removeUrl',
        resolvers: [
          async function resolver() {
            if (this.getData('cart_item_id')) {
              return buildUrl('removeMineCartItem', {
                item_id: this.getData('uuid')
              });
            } else {
              return undefined;
            }
          }
        ],
        dependencies: ['cart_item_id', 'uuid']
      },
      {
        key: 'attribute',
        resolvers: [
          async function resolver() {
            const product = await this.getProduct();
            const response = await createAttribute(product, pool);
            return response;
          }
        ],
        dependencies: ['product_id']
      },
      {
        key: 'old_price',
        resolvers: [
          async function resolver() {

            const product = await this.getProduct();
            return toPrice(product.old_price);
          }
        ],
        dependencies: ['product_id']
      },
      {
        key: 'category_id',
        resolvers: [
          async function resolver(category_id) {
            const triggeredField = this.getTriggeredField();
            const requestedValue = this.getRequestedValue();
            if (triggeredField === 'category_id' && requestedValue !== category_id) {
              return requestedValue;
            }
            return category_id;
          }
        ]
      },
      {
        key: 'trip',
        resolvers: [
          async function resolver() {
            const triggeredField = this.getTriggeredField();
            const requestedValue = this.getRequestedValue();
            return triggeredField === 'trip' ? requestedValue : this.getData('trip');
          }
        ]
      },
      {
        key: 'trip_text',
        resolvers: [
          async function resolver() {
            function formatDateComponent(value) {
              return String(value).padStart(2, '0');
            }

            function convertTimestampToTripString(fromDate, toDate) {
              // Create dayjs objects from the timestamps
              const fromDateObj = dayjs(fromDate);
              const toDateObj = dayjs(toDate);

              // Get day, month, and year components for both dates
              const fromDay = formatDateComponent(fromDateObj.date());

              const toDay = formatDateComponent(toDateObj.date());
              const toMonth = formatDateComponent(toDateObj.month() + 1);
              const toYear = toDateObj.year();


              // Calculate the number of days between fromDate and toDate
              const diffDays = toDateObj.diff(fromDateObj, 'day') + 1;

              // Determine whether to use "day" or "days"
              const dayText = diffDays === 1 ? 'day' : 'days';

              // Format the trip string
              return `Trip: ${fromDay}-${toDay}/${toMonth}/${toYear} (${diffDays} ${dayText})`;
            }

            const trip = this.getData('trip');
            if (!trip || typeof trip !== 'string' || trip.split(',').length < 2) {
              return '';
            }
            const tripArr = trip.split(',');
            return convertTimestampToTripString(Number(tripArr[0]), Number(tripArr[1]));
          }
        ],
        dependencies: ['trip']
      },
      {
        key: 'category',
        resolvers: [
          async function resolver() {
            const homeUrl = getConfig('shop.homeUrl', 'http://localhost:3000');

            const categoryDescriptionQuery = select().from('category_description');

            const categoryId = await this.getData('category_id');
            if (categoryId == null) {
              return {};
            }
            categoryDescriptionQuery.where('category_description_id', '=', categoryId);
            const rows = await categoryDescriptionQuery.execute(pool);
            if (!rows?.length) {
              return {};
            }
            const cateObj = { ...rows[0] };
            return {
              ...cateObj,
              image: cateObj.image ? `${homeUrl}${cateObj.image}` : null
            };
          }
        ],
        dependencies: ['product_id','category_id']
      },
      {
        key: 'titleInfo',
        resolvers: [
          async function resolver() {
            const attrObj = this.getData('attribute');
            const cateObj = this.getData('category');

            if (!cateObj || !attrObj) {
              return null
            }
            return {
              dataAmount: attrObj['data-amount'] != null ? parseFloat(attrObj['data-amount']): null,
              dataAmountUnit: attrObj['data-amount-unit'] ?? null,
              dataType: attrObj['data-type'] ?? null,
              dayAmount: attrObj['day-amount'] != null ? parseFloat(attrObj['day-amount']) : null,
              categoryName: cateObj.name ?? null,
              imgUrl: cateObj.image ? `${cateObj.image}` : null,
              imgAlt: cateObj.name ?? null
            };
          }
        ],
        dependencies: ['category', 'attribute']
      },
      {
        key: 'updated_at',
        resolvers: [
          function resolver(value) {
            return value;
          }
        ]
      },
      {
        key: 'buy_now',
        resolvers: [
          function resolver(value) {
            return value;
          }
        ]
      }
    ];
  };
