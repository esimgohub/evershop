const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

module.exports = {
  Setting: {
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
    },
    adyenAccessKey: (setting) => {
      const adyenConfig = getConfig('system.adyen', {});
      if (adyenConfig.accessKey) {
        return adyenConfig.accessKey;
      }
      const adyenAccessKey = setting.find(
        (s) => s.name === 'adyenAccessKey'
      );
      if (adyenAccessKey) {
        return adyenAccessKey.value;
      } else {
        return null;
      }
    },
    adyenBaseUrl: (setting) => {
      const adyenConfig = getConfig('system.adyen', {});
      if (adyenConfig.baseUrl) {
        return adyenConfig.baseUrl;
      }
      const adyenBaseUrl = setting.find(
        (s) => s.name === 'adyenBaseUrl'
      );
      if (adyenBaseUrl) {
        return adyenBaseUrl.value;
      } else {
        return null;
      }
    },
    adyenSuccessUrl: (setting) => {
      const adyenConfig = getConfig('system.adyen', {});
      if (adyenConfig.successUrl) {
        return adyenConfig.successUrl;
      }
      const adyenSuccessUrl = setting.find(
        (s) => s.name === 'adyenSuccessUrl'
      );
      if (adyenSuccessUrl) {
        return adyenSuccessUrl.value;
      } else {
        return null;
      }
    },
    adyenCancelUrl: (setting) => {
      const adyenConfig = getConfig('system.adyen', {});
      if (adyenConfig.cancelUrl) {
        return adyenConfig.cancelUrl;
      }
      const adyenCancelUrl = setting.find(
        (s) => s.name === 'adyenCancelUrl'
      );
      if (adyenCancelUrl) {
        return adyenCancelUrl.value;
      } else {
        return null;
      }
    },
    adyenSecretKey: (setting, _, { user }) => {
      const adyenConfig = getConfig('system.adyen', {});
      if (adyenConfig.secretKey) {
        return `${adyenConfig.secretKey.substr(
          0,
          5
        )}*******************************`;
      }
      if (user) {
        const adyenSecretKey = setting.find(
          (s) => s.name === 'adyenSecretKey'
        );
        if (adyenSecretKey) {
          return adyenSecretKey.value;
        } else {
          return null;
        }
      } else {
        return null;
      }
    },
    adyenEndpointSecret: (setting, _, { user }) => {
      const adyenConfig = getConfig('system.adyen', {});
      if (adyenConfig.endpointSecret) {
        return `${adyenConfig.endpointSecret.substr(
          0,
          5
        )}*******************************`;
      }
      if (user) {
        const adyenEndpointSecret = setting.find(
          (s) => s.name === 'adyenEndpointSecret'
        );
        if (adyenEndpointSecret) {
          return adyenEndpointSecret.value;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
  }
};
