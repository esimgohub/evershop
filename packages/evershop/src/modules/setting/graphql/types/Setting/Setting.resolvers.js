const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { getCmsPagesBaseQuery } = require('@evershop/evershop/src/modules/cms/services/getCmsPagesBaseQuery');
const { select } = require('@evershop/postgres-query-builder');
const { decode } = require('he');

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

      const socialConfigs = setting.filter(s => s.name.toLowerCase().startsWith("social"));
      
      const numberOfSocialFields = 3;
      const totalSocial = socialConfigs.length / numberOfSocialFields;

      const socialResponses = [];

      for (let index = 1; index <= totalSocial; ++index) {
        const socialIcon = setting.find(s => s.name === `social${index}IconUrl`);
        const socialUrl = setting.find(s => s.name === `social${index}Url`);
        const socialIndex = setting.find(s => s.name === `social${index}Index`);

        socialResponses.push({
          url: socialUrl.value,
          icon: `${homeUrl}${socialIcon.value}`,
          index: socialIndex.value
        });
      }
      
      socialResponses.sort((s1, s2) => s1.index - s2.index);

      const sliderSettings = setting
        .filter((s) => s.name.toLowerCase().startsWith('1sslideritem'));

      const numberOfSliderFields = 8;
      const totalSlider = sliderSettings.length / numberOfSliderFields;
      
      const sliders = [];
      for (let index = 1; index <= totalSlider; ++index) {
        const matchedSliders = sliderSettings.filter((s) => s.name.toLowerCase().includes(`1sslideritem${index}`));

        const sliderSortOrder = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}sortorder`));
        const sliderVisibility = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}visibility`));
        const sliderImageUrl = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}imageurl`));
        const sliderUrl = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}url`));
        const sliderGroup = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}group`));
        const sliderTitle = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}title`));
        const sliderDescription = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}description`));

        sliders.push({
          index: parseInt(sliderSortOrder.value),
          url: sliderUrl.value,
          group:  sliderGroup.value ?? null,
          visibility: parseInt(sliderVisibility.value) === 1,
          imageUrl: `${homeUrl}${sliderImageUrl.value}`,
          title: decode(sliderTitle.value) ?? '',
          description: decode(sliderDescription.value) ?? ''
        })
      }
      // CMS pages
      const query = getCmsPagesBaseQuery();
    
      const pages = await query.execute(pool);

      const staticPages = pages.map(page => {
        return {
          ...camelCase(page),
          url: `${homeUrl}${buildUrl('cmsPageView', { url_key: page.url_key })}`,
        };
      });
  
      return {
        store,
        payment,
        social: socialResponses,
        sliders: sliders.filter((s) => s.visibility === true),
        staticPages
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



