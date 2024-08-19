const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

module.exports = {
  Setting: {
    tazapayPaymentStatus: (setting) => {
      const tazapayConfig = getConfig('system.tazapay', {});
      if (tazapayConfig.status) {
        return tazapayConfig.status;
      }
      const tazapayPaymentStatus = setting.find(
        (s) => s.name === 'tazapayPaymentStatus'
      );
      if (tazapayPaymentStatus) {
        return parseInt(tazapayPaymentStatus.value, 10);
      } else {
        return 0;
      }
    },
    tazapayDislayName: (setting) => {
      const tazapayDislayName = setting.find(
        (s) => s.name === 'tazapayDislayName'
      );
      if (tazapayDislayName) {
        return tazapayDislayName.value;
      } else {
        return 'Credit Card';
      }
    },
    tazapayPublishableKey: (setting) => {
      const tazapayConfig = getConfig('system.tazapay', {});
      if (tazapayConfig.publishableKey) {
        return tazapayConfig.publishableKey;
      }
      const tazapayPublishableKey = setting.find(
        (s) => s.name === 'tazapayPublishableKey'
      );
      if (tazapayPublishableKey) {
        return tazapayPublishableKey.value;
      } else {
        return null;
      }
    }
  }
};
