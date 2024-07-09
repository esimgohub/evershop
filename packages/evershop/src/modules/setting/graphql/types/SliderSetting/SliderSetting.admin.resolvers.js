const { select } = require('@evershop/postgres-query-builder');

module.exports = {
  Query: {
    sliders: async (root, _, { pool }) => {
      const setting = await select().from('setting').execute(pool);

      const sliders = setting
        .filter((s) => s.name.toLowerCase().startsWith('1sslideritem'));

      const numberOfSliderFields = 8;
      const totalSlider = sliders.length / numberOfSliderFields;
      
      const results = [];
      for (let index = 1; index <= totalSlider; ++index) {
        const matchedSliders = sliders.filter((s) => s.name.toLowerCase().includes(`1sslideritem${index}`));

        const sliderSortOrder = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}sortorder`));
        const sliderVisibility = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}visibility`));
        const sliderIndex = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}index`));
        const sliderImageUrl = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}imageurl`));
        const sliderUrl = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}url`));
        const sliderGroup = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}group`));
        const sliderTitle = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}title`));
        const sliderDescription = matchedSliders.find((s) => s.name.toLowerCase().includes(`1sslideritem${index}description`));

        results.push({
          sortOrder: parseInt(sliderSortOrder.value),
          index: parseInt(sliderIndex.value),
          url: sliderUrl.value,
          group: sliderGroup.value ?? null,
          visibility: parseInt(sliderVisibility.value) === 1,
          imageUrl: sliderImageUrl.value,
          title: sliderTitle.value ?? '',
          description: sliderDescription.value ?? ''
        });
      }

      results.sort((a, b) => a.index - b.index);

      return results;
    },
  }
};
