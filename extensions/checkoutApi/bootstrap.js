const { addProcessor } = require('@evershop/evershop/src/lib/util/registry');
const {
  getSetting
} = require('@evershop/evershop/src/modules/setting/services/setting');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

const METHODS = [
  {
    code: 'tazapay',
    name: 'Tazapay'
  },
  { code: 'adyen', name: 'Adyen' }
];

module.exports = () => {
  addProcessor('paymentMethodList', (fields) => {
    METHODS.forEach(async (ite) => {
      const tazapayConfig = getConfig(`system.${ite.code}}`, {});
      let tazapayStatus;
      if (tazapayConfig.status) {
        tazapayStatus = tazapayConfig.status;
      } else {
        tazapayStatus = await getSetting(`${ite.code}PaymentStatus`, 0);
      }
      if (parseInt(tazapayStatus, 10) === 1) {
        fields.push({
          code: ite.code,
          name: ite.name
        });
      }
    });
    return fields;
  });
};
