const { Client, CheckoutAPI } = require('@adyen/api-library');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

const {
  ThreeDSRequestData,
  PaymentRequest
} = require('@adyen/api-library/lib/src/typings/checkout/models');
const { select } = require('@evershop/postgres-query-builder');
const {
  getOrdersBaseQuery
} = require('@evershop/evershop/src/modules/oms/services/getOrdersBaseQuery');
const {
  getSetting
} = require('@evershop/evershop/src/modules/setting/services/setting');
const {
  saveCart
} = require('@evershop/evershop/src/modules/checkout/services/saveCart');
const {
  setContextValue
} = require('@evershop/evershop/src/modules/graphql/services/contextHelper');
const {
  createNewCart
} = require('@evershop/evershop/src/modules/checkout/services/createNewCart');
const generateResponse = (adyenResponse) => {
  if (!adyenResponse) {
    return {
      error: 'Failed to process payment'
    };
  }

  return {
    success: true,
    ...adyenResponse
  };
};

function convertToMinorUnits(amount, currency) {
  const currencyMinorUnits = {
    USD: 2,
    VND: 0
  };

  const minorUnits = currencyMinorUnits[currency];

  if (minorUnits === undefined) {
    throw new Error(`Unknown currency: ${currency}`);
  }

  return amount * Math.pow(10, minorUnits);
}

module.exports = {
  paymentNative: async function (
    order,
    orderItems,
    adyenData,
    countryCode,
    shopperIp
  ) {
    try {
      const reference = order?.order_number;

      const authenticationData = {
        threeDSRequestData: {
          challengeWindowSize: '05', // here you can pass the size of the challenge window, this defaults to 05 which is 100%
          nativeThreeDS: 'preferred' // set 'preferred' for Native
        }
      };
      const merchantAccount = await getSetting(
        'adyenMerchantAccount',
        null
      );
      const adyenApiKey = await getSetting(
        'adyenApiKey',
        null
      );

      let firstName = null
      let lastName = null
      if (order?.customer_full_name) {
        const nameParts = order.customer_full_name.trim().split(/\s+/); // Split by spaces and remove extra spaces
        firstName = nameParts[0]; // First word is the first name
        lastName = nameParts.slice(1).join(' '); // Join the rest as the last name
      } else {
        firstName = 'Bear'
        lastName = 'Gohub'
      }

      const browserInfo = adyenData?.browserInfo ?? null

      const paymentRequestData = {
        additionalData: {
          'riskdata.skipRisk': 'true'
        },
        amount: {
          currency: order.currency,
          value: convertToMinorUnits(Number(order.grand_total), order.currency)
        },
        lineItems: orderItems.map((item) => ({
          sku: item.product_sku,
          quantity: item.qty
        })),

        reference: reference,
        authenticationData: {
          ...authenticationData
        },
        shopperInteraction: 'Ecommerce',
        countryCode: countryCode ?? 'VN',
        shopperName: {
          firstName: firstName,
          lastName: lastName
        },
        shopperEmail: order.customer_email ?? await getSetting('storeEmail', 'booking@gohub.vn'),
        channel: adyenData.channel, // required for native
        browserInfo, // required for native
        // origin: 'http://127.0.0.1:8080/', // required for native
        paymentMethod: adyenData.paymentMethod,
        merchantAccount: merchantAccount,
        merchantRiskIndicator: {
          addressMatch: false,
          deliveryAddressIndicator: 'digitalGoods'
        }
      };
      if (shopperIp) {
        paymentRequestData.shopperIP = shopperIp;
      }

      const client = new Client({
        apiKey: adyenApiKey,
        environment: getConfig('system.adyen.environment', 'TEST'),
        config: {
          connectionTimeoutMillis: 10000
        }
      });

      // intialise the API object with the client object
      const paymentsAPI = new CheckoutAPI(client).PaymentsApi; //CheckoutAPI exports a number of helpers for different API's, since we want to use Payments API we want a reference to PaymentsAPI
      const idempotencyKey = reference;
      console.log('adyenApiKey: ', adyenApiKey);
      console.log('merchantAccount: ', merchantAccount);
      console.log('adyenPaymentRequestData: ', paymentRequestData);

      const paymentResponse = await paymentsAPI.payments(paymentRequestData, {
        idempotencyKey: idempotencyKey
      });

      return generateResponse(paymentResponse);
    } catch (e) {
      console.error('adyenError: ', e);
      return generateResponse(null);
    }
  },
  payloadDto: async function (req, res) {},
  responseDto: async function (req, res) {},
  createCartByUnSelectedItems: async function (
    request,
    unPurchasedItems,
    customerId,
    pool
  ) {
    // Load the customer from the database
    const customer = await select()
      .from('customer')
      .where('customer_id', '=', customerId)
      .and('status', '=', 1)
      .load(pool);
    // Create a new cart for the customer
    const newCart = await createNewCart(
      request.locals.sessionID,
      request.cookies.isoCode || getConfig('shop.currency', 'USD'),
      customer || {}
    );

    // Add items from the current cart to the new cart with `is_active` set to `false`
    if (unPurchasedItems && unPurchasedItems.length > 0) {
      await Promise.all(
        unPurchasedItems.map(async (item) => {
          const prod = await item.getProduct();
          const qty = await item.getData('qty');
          const categoryId = await item.getData('category_id');
          const tripStr = await item.getData('trip');

          const newItem = await newCart.addItem(prod.product_id, qty);
          await newItem.updateCategoryId(parseInt(categoryId, 10));
          await newItem.cloneTripDateStr(tripStr);
        })
      );
      await saveCart(newCart);
    }
  },
  getDefaultAddress: async function () {
    return {
      address_1: await getSetting(
        'storeAddress',
        '3/12 Phổ Quang, Phường 2, Quận Tân Bình (Khu biệt thự Mekong)'
      ),
      city: await getSetting('storeCity', 'Ho Chi Minh'),
      country: await getSetting('storeCountry', 'VN'),
      full_name: await getSetting('storeName', 'SIM & eSIM Quốc Tế Gohub'),
      postcode: await getSetting('storePostalCode', '72108'),
      province: await getSetting('storeProvince', 'VN-SG'),
      telephone: await getSetting('storePhoneNumber', '0866440022')
    };
  },
  getOrderByCartUUID: async function (cart_uuid, pool) {
    const cart = await select()
      .from('cart')
      .where('uuid', '=', cart_uuid)
      .load(pool);

    let order = null;
    const query = getOrdersBaseQuery();
    query.where('cart_id', '=', cart.cart_id);
    order = await query.load(pool);
    return order;
  },
  getPaymentList: async function () {
    try {
      const merchantAccount = await getSetting(
        'adyenMerchantAccount',
        null
      );
      const adyenApiKey = await getSetting(
        'adyenApiKey',
        null
      );
      const postData = {
        merchantAccount: merchantAccount
      };

      const client = new Client({
        apiKey: adyenApiKey,
        environment: getConfig('system.adyen.environment', 'TEST'),
        config: {
          connectionTimeoutMillis: 10000
        }
      });

      // intialise the API object with the client object
      const paymentsAPI = new CheckoutAPI(client).PaymentsApi; //CheckoutAPI expo
      const paymentMethodsResponse = await paymentsAPI.paymentMethods({
        ...postData
      });

      return paymentMethodsResponse?.paymentMethods ?? [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },
  submitPaymentDetails: async function (details) {
    try {
      const adyenApiKey = await getSetting(
        'adyenApiKey',
        null
      );
      const client = new Client({
        apiKey: adyenApiKey,
        environment: getConfig('system.adyen.environment', 'TEST'),
        config: {
          connectionTimeoutMillis: 10000
        }
      });

      // intialise the API object with the client object
      const paymentsAPI = new CheckoutAPI(client).PaymentsApi; //CheckoutAPI expo
      const paymentDetailsResponse = await paymentsAPI.paymentsDetails({ details });
      if (!paymentDetailsResponse?.resultCode) {
        throw new Error(`Failed to get payment details from adyen: ${paymentDetailsResponse}`);
      }

      return paymentDetailsResponse;
    } catch (e) {
      console.error(e);
      return null
    }
  }
};
