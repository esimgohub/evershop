const { select } = require('@evershop/postgres-query-builder');

module.exports = {
  Query: {
    sliders: async (root, _, { pool }) => {
      const setting = await select().from('setting').execute(pool);

      const sliders = setting
        .filter((s) => s.name.startsWith('slider'));

      const numberOfSliderFields = 4;
      const totalSlider = sliders.length / numberOfSliderFields;
      
      const results = [];
      for (let index = 1; index <= totalSlider; ++index) {
        const matchedSliders = sliders.filter((s) => s.name.includes(`slider${index}`));

        const sliderSortOrder = matchedSliders.find((s) => s.name.toLowerCase().includes('sortorder'));
        const sliderVisibility = matchedSliders.find((s) => s.name.toLowerCase().includes('visibility'));
        const sliderIndex = matchedSliders.find((s) => s.name.toLowerCase().includes('index'));
        const sliderImageUrl = matchedSliders.find((s) => s.name.toLowerCase().includes('url'));


        results.push({
          sortOrder: parseInt(sliderSortOrder.value),
          index: parseInt(sliderIndex.value),
          visibility: parseInt(sliderVisibility.value) === 1,
          imageUrl: sliderImageUrl.value
        });
      }

      results.sort((a, b) => a.sortOrder - b.sortOrder);

      return results;
    },
  }
};
