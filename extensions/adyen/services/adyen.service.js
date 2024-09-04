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
      const reference = order?.uuid; // generate a unique reference id

      const authenticationData = {
        threeDSRequestData: {
          challengeWindowSize: '05', // here you can pass the size of the challenge window, this defaults to 05 which is 100%
          nativeThreeDS: 'preferred' // set 'preferred' for Native
        }
      };
      const merchantAccount = await getSetting(
        'adyenMerchantAccount',
        'GoHub_US'
      );
      const adyenApiKey = await getSetting(
        'adyenApiKey',
        'AQEthmfxLI/JbxBBw0m/n3Q5qf3Vb4RlGJF1f3dZ02iPEoM99AZuGjuAhnwEpRNQEMFdWw2+5HzctViMSCJMYAc=-jUOsQpq1oa50zIyr3tqAC1LSB4FoXdjK/Nx5Z5k4zEQ=-i1isE<xj)L^4k6QxD9='
      );

      const paymentRequestData = {
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
        // todo: dynamic
        countryCode: countryCode ?? 'VN',
        shopperName: {
          firstName: order?.first_name ?? 'Test',
          lastName: order?.last_name ?? 'Shopper'
        },
        shopperEmail: order?.email ?? 'test@adyen.com',
        channel: adyenData.channel, // required for native
        browserInfo: adyenData.browserInfo, // required for native
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
        environment: 'TEST'
      });

      // intialise the API object with the client object
      const paymentsAPI = new CheckoutAPI(client).PaymentsApi; //CheckoutAPI exports a number of helpers for different API's, since we want to use Payments API we want a reference to PaymentsAPI
      const idempotencyKey = reference;
      const paymentResponse = await paymentsAPI.payments(paymentRequestData, {
        idempotencyKey: idempotencyKey
      });

      return generateResponse(paymentResponse);
    } catch (e) {
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
        'GoHub_US'
      );
      const adyenApiKey = await getSetting(
        'adyenApiKey',
        'AQEthmfxLI/JbxBBw0m/n3Q5qf3Vb4RlGJF1f3dZ02iPEoM99AZuGjuAhnwEpRNQEMFdWw2+5HzctViMSCJMYAc=-jUOsQpq1oa50zIyr3tqAC1LSB4FoXdjK/Nx5Z5k4zEQ=-i1isE<xj)L^4k6QxD9='
      );
      const postData = {
        merchantAccount: merchantAccount
      };

      const client = new Client({
        apiKey: adyenApiKey,
        environment: 'TEST'
      });

      // intialise the API object with the client object
      const paymentsAPI = new CheckoutAPI(client).PaymentsApi; //CheckoutAPI expo
      const paymentMethodsResponse = await paymentsAPI.paymentMethods({
        ...postData
      });

      return paymentMethodsResponse?.paymentMethods ?? [];
    } catch (e) {
      return [];
    }
  },
  paymentDto: async function (payment) {
    return {};
  }
  //   todo: add webhook data model
};

const mockPay = {
  brand: 'visa',
  checkoutAttemptId: 'do-not-track',
  holderName: '',
  type: 'scheme',
  encryptedCardNumber:
    'eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZDQkMtSFM1MTIiLCJ2ZXJzaW9uIjoiMSJ9.DL5qX4mvmJGjjPpji6AozZ0OOl0fLvUty-Dd1b-VmxIpbIwZ0T4_tMiZ7p5cxAq8jIS3NKjvfCEfshXRZJd6igaiWpT2oUq2wHpUHpMTKcc52GHDg4VFl4nQPrwt53Bcerpmz_qTMrC7EFifusXpo3j3SQKjbRmjHjcAn33-wuY9PyhnFkjpOFGPbyx0RSGRoCq6XHbvD1ejGXMAl-sCGtIR-PJLyjRLsBtDMAy501foFj6yD3DZzteoBmb9PxyUg-bz_19a2l-EiK7zG-JCf7H4wPA2dN5wj-zY_jlbKX3426sGPYpG9TGQFYdXHSeGzklq5iAhZTUyB9sCDFRKRA.AUyeh01VmVQ_MW0y1fPcMA.hUJoVJ0v9LAZeGOGnAvJ4VswW50PXYAGPvh7HjkR6R9oCFsnY_aSPplB4-Y3zK6PE9jiKmC3WCF2rBODwrwMtCbi-sPm8VJZR5yCk2aIOSWX9tborwshNwdKcXBMx9dVhqKkPBLZ1loaQTfW1qaLRv8b-j88XBMtTFf1SBh_gocRolbRpIpGUKMgR5jih7bCJKIXalx4jklUS_a3th-NwuOce1Gv-9hdeOg-JDA4RRtjk3f5ZUkjPgbCsg4IkPfJw-5M_GvPw7tDm1cPe2W0XlZ-bSTIR_d_MuPSTbzN8fU9kJtvxoCgmIbLqqEhAIdzHgMymr6vcbYddv-n26vDYGiNOANcIBre6DMKA0BKoVF8IYaMcsxst8Zvf51dvhVp8kVYuZZ0rVzP6MdO9EKnrLhrn_1PaVLN4zNv0FwGVdemewLDTzpPh3qPa_THg9GlsQ83QtpccTvSvRNZOB5j7CTabsOod8qx523XRQiEzxxCpBGgTY_g-L7iyMPcLrelsWiruLOVXWVcM0B9-XVM61O4a0bec1392-60thqE_F2d-NFaaeKQS7rGcxMMH2M1.zvGXIzh9vOG1xHvSuAwgi7c1nje-2UMSnYCabpH2NOw',
  encryptedExpiryMonth:
    'eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZDQkMtSFM1MTIiLCJ2ZXJzaW9uIjoiMSJ9.KCy9hGcra_gwcya6oudT-o0FIhm6iCEaWgl05rWYcXWlyarfRHk1pJ8zzdkZb2IJ3anaoPMdjlhlG93x3ufQF-_iHyrBFoRRyynnD7JLbp47JDmW-nFEnd3iVsnEBGhxK7E4gmW365RBRRhI9mm6bh88Y_qqAU-92FT0r9JuzVYIswl1PzZG6toREGnYjEOYPxunJSJ6-UuYtcrBT21tKbAVbL-1JPJqqGi-z1RVRxUo51o_rmP8Ljp_YH5hAjGTE6OTWKEdt13P8x_ogwcO-Lnxs1dYhw8n0e-oStd7pZGo8moVfkQW1C-2rl3vWPcg9LSTncXgQCp4TC2aL2n8fQ.XeK4ciriTEHTqRaa9f_5Jg.2l8L2Bq7JFT-3enWDtxv0PH6fgwHRp-xewxv7uxG0hUPGrC-yGlVlmOaGz79uLxR-L3xf1tLimFpRQutQ4Rt5w.8slknbG-7Z7uOqOIZBNcTh_Y5MSfoQ9MM3ieZBKKcvs',
  encryptedExpiryYear:
    'eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZDQkMtSFM1MTIiLCJ2ZXJzaW9uIjoiMSJ9.R_yJKtIMhQ7AxFjTirrzJjYkOxNm1zGH6B0phrQlzVszf8ESM_RPtq9g0T1Z2_XvZ0iubcAI-DxZKxcfjGOSoTwOFRHaDxwrOGFyanUDjF2s1slDuLhGeMxwiVN3U6VEPuh2OmLs6iNVbZgXZF-JjncRkGXgqsYN-9KBZdsr0RZpugiHJIfPK6mTkRrFXnUdT1Uuu5gcCJ8JtIsMrbIobiqDcsoGjf1Mc0ZLSZtBq2rdLm_huLXzi_KI6Icf-sS9lf_UEiiIyKQ-3j7NQ5JNYBW7TwJFs6juZCjkIgpwlxRJ7cdKorA6CdwZbNME4-yW2pdv9XLziJr0OYx8cFK1JQ.B8i-eMLOjL23ZyoqBJCfaQ.BKakMZlk0_ASMPlAM5a5RTz_KQvRRr0j8jh_FBcdtRkKU-6Yu-MqjhXhWO9boqOvTLnIK4c7e5K4o_hiQD4kdA.5kEuaWkNqq5uYIzpPTf6JtZWOS9MO5dKBBn3z6vj-kQ',
  encryptedSecurityCode:
    'eyJhbGciOiJSU0EtT0FFUCIsImVuYyI6IkEyNTZDQkMtSFM1MTIiLCJ2ZXJzaW9uIjoiMSJ9.cFiiWspR4grZ2WwgGG-ZoNm25xXK8EZxFO4Ne_uGuifP1EVs3oih31tzD-h_vHX97Ej3Y2deFFzQHnyhaYCqCbcH7XvQzg5TLYJukaODqxRYctvXTE2Uu9VX84dKsX-4isMXgIMf9NbyWAN5y234weGDI3O1zZPNpcz5NUzZynR9-kB0KVqBa6tTpAAhAgXvTQI0rL89u9-d_1_oSw7C4P-9OWNgkjTpV4EjKYPaFzE-v2IDJ74j8UgqfTFpp4ZkzdDE8uIFY7YgRNlch6hLvNPhrZH9j9WYWgbLITSmCR8q_xzFlKGKab-hnLPBCZrpwP5WCkIOicoBUYX5A8bJVg.QfP4kTlFU-KLOpcw30byTg.Lk7vdAB787EUK39Bmw4g-9SaDd7tR9V5e6i5LAsBX_XcOdIkCSfipdms5rLY1S6gpLCtpFn4TgWa_iOrcFRCej_3EfYCq3EnyJT7kBdFWtw.LY1CagJenPAnOEv3Fe1JKFpkAwuw3oTohRpZSsnrT6E'
};
