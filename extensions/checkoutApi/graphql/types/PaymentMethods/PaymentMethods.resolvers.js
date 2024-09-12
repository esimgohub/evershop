const { getValue } = require('@evershop/evershop/src/lib/util/registry');
const { getPaymentList } = require('../../../../adyen/services/adyen.service');

module.exports = {
  Query: {
    paymentMethods: async () => {
      try {
        const fields = await getValue('paymentMethodList', []);
        const res = [];
        for (const field of fields) {
          if (field.code === 'adyen') {
            const adyenList = await getPaymentList();
            res.push({
              ...field,
              additionalData: {
                supportedMethods: adyenList
              }
            });
          } else {
            res.push({ ...field });
          }
        }
        return res;
      } catch (error) {
        return null;
      }
    }
  }
};
