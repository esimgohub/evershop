const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

module.exports = {
  Setting: {
    adyenPaymentStatus: (setting) => {
      const adyenConfig = getConfig('system.adyen', {});
      if (adyenConfig.status) {
        return adyenConfig.status;
      }
      const adyenPaymentStatus = setting.find(
        (s) => s.name === 'adyenPaymentStatus'
      );
      if (adyenPaymentStatus) {
        return parseInt(adyenPaymentStatus.value, 10);
      } else {
        return 0;
      }
    },
    adyenDislayName: (setting) => {
      const adyenDislayName = setting.find(
        (s) => s.name === 'adyenDislayName'
      );
      if (adyenDislayName) {
        return adyenDislayName.value;
      } else {
        return 'Credit Card';
      }
    },
    adyenPublishableKey: (setting) => {
      const adyenConfig = getConfig('system.adyen', {});
      if (adyenConfig.publishableKey) {
        return adyenConfig.publishableKey;
      }
      const adyenPublishableKey = setting.find(
        (s) => s.name === 'adyenPublishableKey'
      );
      if (adyenPublishableKey) {
        return adyenPublishableKey.value;
      } else {
        return null;
      }
    }
  }
};
