const { select } = require('@evershop/postgres-query-builder');

module.exports = {
  Query: {
    sliders: async (root, _, { pool }) => {
      const setting = await select().from('setting').execute(pool);

      const sliders = setting
        .filter((s) => s.name.toLowerCase().startsWith('slideritem'));

      const numberOfSliderFields = 5;
      const totalSlider = sliders.length / numberOfSliderFields;
      
      const results = [];
      for (let index = 1; index <= totalSlider; ++index) {
        const matchedSliders = sliders.filter((s) => s.name.includes(`slideritem${index}`));

        const sliderSortOrder = matchedSliders.find((s) => s.name.toLowerCase().includes(`slideritem${index}sortorder`));
        const sliderVisibility = matchedSliders.find((s) => s.name.toLowerCase().includes(`slideritem${index}visibility`));
        const sliderIndex = matchedSliders.find((s) => s.name.toLowerCase().includes(`slideritem${index}index`));
        const sliderImageUrl = matchedSliders.find((s) => s.name.toLowerCase().includes(`slideritem${index}imageurl`));
        const sliderUrl = matchedSliders.find((s) => s.name.toLowerCase().includes(`slideritem${index}url`));
        const sliderGroup = matchedSliders.find((s) => s.name.toLowerCase().includes(`slideritem${index}group`));

        results.push({
          sortOrder: parseInt(sliderSortOrder.value),
          index: parseInt(sliderIndex.value),
          url: sliderUrl.value,
          group: sliderGroup ?? null,
          visibility: parseInt(sliderVisibility.value) === 1,
          imageUrl: sliderImageUrl.value
        });
      }

      console.log("result: ", results);

      results.sort((a, b) => a.index - b.index);

      return results;
    },
  }
};
