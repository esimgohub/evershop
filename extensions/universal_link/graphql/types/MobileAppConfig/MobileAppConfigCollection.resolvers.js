
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

module.exports = {
  Query: {
    appStoreConfig: () => {
      return {
        googlePlayUrl: getConfig('store.googlePlay.url'),
        appStoreUrl: getConfig('store.appStore.url'),
      };
    },
    mobileAppConfig: () => {
      return {
        baseUrl: getConfig('application.baseUrl'),
        url: getConfig('application.url'),
      }
    },
  }
};
