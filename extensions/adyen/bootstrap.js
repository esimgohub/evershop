const { addProcessor } = require('@evershop/evershop/src/lib/util/registry');
const {
  getSetting
} = require('@evershop/evershop/src/modules/setting/services/setting');

module.exports = () => {
  addProcessor('cartFields', (fields) => {
    fields.push({
      key: 'payment_method',
      resolvers: [
        async function resolver(paymentMethod) {
          if (paymentMethod !== 'adyen') {
            return paymentMethod;
          } else {
            // Validate the payment method
            const adyenPaymentStatus = await getSetting('adyenPaymentStatus');
            if (parseInt(adyenPaymentStatus, 10) !== 1) {
              return null;
            } else {
              this.setError('payment_method', undefined);
              return paymentMethod;
            }
          }
        }
      ]
    });
    return fields;
  });
};
