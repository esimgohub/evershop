const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

module.exports = {
  Setting: {
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
    },
    tazapayAccessKey: (setting) => {
      const tazapayConfig = getConfig('system.tazapay', {});
      if (tazapayConfig.accessKey) {
        return tazapayConfig.accessKey;
      }
      const tazapayAccessKey = setting.find(
        (s) => s.name === 'tazapayAccessKey'
      );
      if (tazapayAccessKey) {
        return tazapayAccessKey.value;
      } else {
        return null;
      }
    },
    tazapayBaseUrl: (setting) => {
      const tazapayConfig = getConfig('system.tazapay', {});
      if (tazapayConfig.baseUrl) {
        return tazapayConfig.baseUrl;
      }
      const tazapayBaseUrl = setting.find(
        (s) => s.name === 'tazapayBaseUrl'
      );
      if (tazapayBaseUrl) {
        return tazapayBaseUrl.value;
      } else {
        return null;
      }
    },
    tazapaySuccessUrl: (setting) => {
      const tazapayConfig = getConfig('system.tazapay', {});
      if (tazapayConfig.successUrl) {
        return tazapayConfig.successUrl;
      }
      const tazapaySuccessUrl = setting.find(
        (s) => s.name === 'tazapaySuccessUrl'
      );
      if (tazapaySuccessUrl) {
        return tazapaySuccessUrl.value;
      } else {
        return null;
      }
    },
    tazapayCancelUrl: (setting) => {
      const tazapayConfig = getConfig('system.tazapay', {});
      if (tazapayConfig.cancelUrl) {
        return tazapayConfig.cancelUrl;
      }
      const tazapayCancelUrl = setting.find(
        (s) => s.name === 'tazapayCancelUrl'
      );
      if (tazapayCancelUrl) {
        return tazapayCancelUrl.value;
      } else {
        return null;
      }
    },
    tazapaySecretKey: (setting, _, { user }) => {
      const tazapayConfig = getConfig('system.tazapay', {});
      if (tazapayConfig.secretKey) {
        return `${tazapayConfig.secretKey.substr(
          0,
          5
        )}*******************************`;
      }
      if (user) {
        const tazapaySecretKey = setting.find(
          (s) => s.name === 'tazapaySecretKey'
        );
        if (tazapaySecretKey) {
          return tazapaySecretKey.value;
        } else {
          return null;
        }
      } else {
        return null;
      }
    },
    tazapayEndpointSecret: (setting, _, { user }) => {
      const tazapayConfig = getConfig('system.tazapay', {});
      if (tazapayConfig.endpointSecret) {
        return `${tazapayConfig.endpointSecret.substr(
          0,
          5
        )}*******************************`;
      }
      if (user) {
        const tazapayEndpointSecret = setting.find(
          (s) => s.name === 'tazapayEndpointSecret'
        );
        if (tazapayEndpointSecret) {
          return tazapayEndpointSecret.value;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
  }
};
