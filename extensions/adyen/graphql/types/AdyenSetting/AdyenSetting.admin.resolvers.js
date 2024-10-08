const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

module.exports = {
  Setting: {
    adyenHmacKey: (setting) => {
      const adyenConfig = getConfig('system.adyen', {});
      if (adyenConfig.hmacKey) {
        return adyenConfig.hmacKey;
      }
      const adyenHmacKey = setting.find((s) => s.name === 'adyenHmacKey');
      if (adyenHmacKey) {
        return adyenHmacKey.value;
      } else {
        return null;
      }
    },
    adyenMerchantAccount: (setting) => {
      const adyenConfig = getConfig('system.adyen', {});
      if (adyenConfig.merchantAccount) {
        return adyenConfig.merchantAccount;
      }
      const adyenMerchantAccount = setting.find(
        (s) => s.name === 'adyenMerchantAccount'
      );
      if (adyenMerchantAccount) {
        return adyenMerchantAccount.value;
      } else {
        return null;
      }
    },
    adyenAppReturnUrl: (setting) => {
      const adyenConfig = getConfig('system.adyen', {});
      if (adyenConfig.appReturnUrl) {
        return adyenConfig.appReturnUrl;
      }
      const adyenAppReturnUrl = setting.find(
        (s) => s.name === 'adyenAppReturnUrl'
      );
      if (adyenAppReturnUrl) {
        return adyenAppReturnUrl.value;
      } else {
        return null;
      }
    },
    adyenApiKey: (setting, _, { user }) => {
      const adyenConfig = getConfig('system.adyen', {});
      if (adyenConfig.apiKey) {
        return adyenConfig.apiKey;
      }
      const adyenApiKey = setting.find((s) => s.name === 'adyenApiKey');
      if (adyenApiKey) {
        return adyenApiKey.value;
      } else {
        return null;
      }
    }
  }
};
