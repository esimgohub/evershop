const { select } = require('@evershop/postgres-query-builder');

module.exports = {
  Query: {
    setting: async (root, _, { pool }) => {
      // Store name
      // Company name
      // address
      // tax code
      // business ID
      // phone number
      // hotline 
      // email
      // social links
      // default currency
      // default locale
      // default meta site title
      // default meta site description
      // default meta  site keyword

      const setting = await select().from('setting').execute(pool);
      return setting;
    }
  },
  Setting: {
    storeName: (setting) => {
      const storeName = setting.find((s) => s.name === 'storeName');
      if (storeName) {
        return storeName.value;
      } else {
        return 'EverShop Store';
      }
    }
  }
};
