const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response) => {
  // Check if Adyen is enabled
  
    adyenStatus = await getSetting('adyenPaymentStatus', 0);
  if (parseInt(adyenStatus, 10) === 1) {
    return {
      methodCode: 'adyen',
      methodName: await getSetting('adyenDislayName', 'Adyen')
    };
  } else {
    return null;
  }
};
