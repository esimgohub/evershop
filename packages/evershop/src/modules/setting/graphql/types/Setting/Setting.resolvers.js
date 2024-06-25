const { select } = require('@evershop/postgres-query-builder');

module.exports = {
  Query: {
    setting: async (root, _, { pool }) => {
      const setting = await select().from('setting').execute(pool);
      return setting;
    },
    config: async (root, _, { pool, homeUrl }) => {
      const setting = await select().from('setting').execute(pool);

      const store = {
        name: setting.find(s => s.name === "storeName") ? setting.find(s => s.name === "storeName").value : null,
        description: setting.find(s => s.name === "storeDescription") ? setting.find(s => s.name === "storeDescription").value : null,
        currency: setting.find(s => s.name === "storeCurrency") ? setting.find(s => s.name === "storeCurrency").value : "USD",
        timeZone: setting.find(s => s.name === "storeTimeZone") ? setting.find(s => s.name === "storeTimeZone").value : "America/Sai_Gon",
        email: setting.find(s => s.name === "storeEmail") ? setting.find(s => s.name === "storeEmail").value : null,
        country: setting.find(s => s.name === "storeCountry") ? setting.find(s => s.name === "storeCountry").value : null,
        address: setting.find(s => s.name === "storeAddress") ? setting.find(s => s.name === "storeAddress").value : null,
        city: setting.find(s => s.name === "storeCity") ? setting.find(s => s.name === "storeCity").value : null, 
        province: setting.find(s => s.name === "storeProvince") ? setting.find(s => s.name === "storeProvince").value : null,
        postalCode: setting.find(s => s.name === "storePostalCode") ? setting.find(s => s.name === "storePostalCode").value : null,
        language: setting.find(s => s.name === "storeLanguage") ? setting.find(s => s.name === "storeLanguage").value : null,
        phoneNumber: setting.find(s => s.name === "storePhoneNumber") ? setting.find(s => s.name === "storePhoneNumber").value : null
      }

      const payment = {
        paypal: {
          displayName: setting.find(s => s.name === "paypalDislayName") ? setting.find(s => s.name === "paypalDislayName").value : null,
          environment: setting.find(s => s.name === "paypalEnvironment") ? setting.find(s => s.name === "paypalEnvironment").value : null,
        },
        stripe: {
          publishableKey: setting.find(s => s.name === "stripePublishableKey") ? setting.find(s => s.name === "stripePublishableKey").value : null,
          secretKey: setting.find(s => s.name === "stripeSecretKey") ? setting.find(s => s.name === "stripeSecretKey").value : null,
          displayName: setting.find(s => s.name === "stripeDislayName") ? setting.find(s => s.name === "stripeDislayName").value : null,
        },
        cod: {
          status: setting.find(s => s.name === "codPaymentStatus") ? setting.find(s => s.name === "codPaymentStatus").value : null,
          displayName: setting.find(s => s.name === "codDislayName") ? setting.find(s => s.name === "codDislayName").value : null,
        }
      };

      const social = {
        facebook: {
          url: setting.find(s => s.name === "facebookUrl") ? setting.find(s => s.name === "facebookUrl").value : null,
          icon: setting.find(s => s.name === "facebookIconUrl") ? setting.find(s => s.name === "facebookIconUrl").value : null
        },
        tiktok: {
          url: setting.find(s => s.name === "tiktokUrl") ? setting.find(s => s.name === "tiktokUrl").value : null,
          icon: setting.find(s => s.name === "tiktokIconUrl") ? setting.find(s => s.name === "tiktokIconUrl").value : null
        },
        instagram: {
          url: setting.find(s => s.name === "instagramUrl") ? setting.find(s => s.name === "instagramUrl").value : null,
          icon: setting.find(s => s.name === "instagramIconUrl") ? setting.find(s => s.name === "instagramIconUrl").value : null
        },
        thread: {
          url: setting.find(s => s.name === "threadUrl") ? setting.find(s => s.name === "threadUrl").value : null,
          icon: setting.find(s => s.name === "threadIconUrl") ? setting.find(s => s.name === "threadIconUrl").value : null
        }
      }


      const sliderSettings = setting
        .filter((s) => s.name.startsWith('slider'));

      const numberOfSliderFields = 4;
      const totalSlider = sliderSettings.length / numberOfSliderFields;
      
      const results = [];
      for (let index = 1; index <= totalSlider; ++index) {
        const matchedSliders = sliderSettings.filter((s) => s.name.includes(`slider${index}`));

        const sliderSortOrder = matchedSliders.find((s) => s.name.toLowerCase().includes('sortorder'));
        const sliderVisibility = matchedSliders.find((s) => s.name.toLowerCase().includes('visibility'));
        const sliderImageUrl = matchedSliders.find((s) => s.name.toLowerCase().includes('imageurl'));
        const sliderUrl = matchedSliders.find((s) => s.name.toLowerCase().includes('url'));


        results.push({
          sortOrder: parseInt(sliderSortOrder.value),
          url: sliderUrl.value,
          visibility: parseInt(sliderVisibility.value) === 1,
          imageUrl: `${homeUrl}${sliderImageUrl.value}`,
        })
      }
  
      const sliders = results.filter((s) => s.visibility === true).sort((a, b) => a.sortOrder - b.sortOrder).map((s, index) => ({
        ...s,
        index: index + 1,
      }));
  
      return {
        store,
        payment,
        social,
        sliders
      }
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



