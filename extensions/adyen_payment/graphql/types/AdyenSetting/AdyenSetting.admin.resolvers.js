const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

module.exports = {
  Setting: {
    adyenApiKey: (setting, _, { user }) => {
      
      if (user) {
        const adyenApiKey = setting.find(
          (s) => s.name === 'adyenApiKey'
        );
        if (adyenApiKey) {
          return adyenApiKey.value;
        } else {
          return null;
        }
      } else {
        return null;
      }
    },

    adyenMerchantAccount: (setting, _, { user }) => {
      if (user) {
        const adyenMerchantAccount = setting.find(
          (s) => s.name === 'adyenMerchantAccount'
        );
        if (adyenMerchantAccount) {
          return adyenMerchantAccount.value;
        } else {
          return null;
        }
      } else {
        return null;
      }
    },
    adyenHmacKey: (setting, _, { user }) => {
      if (user) {
        const adyenHmacKey = setting.find(
          (s) => s.name === 'adyenHmacKey'
        );
        if (adyenHmacKey) {
          return `${adyenHmacKey.value.substr(
            0,
            5
          )}*******************************`;
        } else {
          return null;
        }
      } else {
        return null;
      }
    },
  }
};
