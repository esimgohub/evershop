const { select } = require('@evershop/postgres-query-builder');

module.exports = {
  Query: {
    sliders: async (root, _, { pool }) => {
      const setting = await select().from('setting').execute(pool);

      const sliders = setting
        .filter((s) => s.name.toLowerCase().startsWith('1sslideritem'));
      
      const results = [];
      const sliderIndexes = sliders.filter((s) => s.name.toLowerCase().includes('1sslideritem') && s.name.toLowerCase().includes(`index`));
      for (const sliderIndex of sliderIndexes) {
        const matchedSliderItems = sliders.filter((s) => s.name.toLowerCase().includes(`1sslideritem${sliderIndex.value}`));

        const sliderSortOrder = matchedSliderItems.find((s) => s.name.toLowerCase().includes(`1sslideritem${sliderIndex.value}sortorder`));
        const sliderVisibility = matchedSliderItems.find((s) => s.name.toLowerCase().includes(`1sslideritem${sliderIndex.value}visibility`));
        const sliderImageUrl = matchedSliderItems.find((s) => s.name.toLowerCase().includes(`1sslideritem${sliderIndex.value}imageurl`));
        const sliderUrl = matchedSliderItems.find((s) => s.name.toLowerCase().includes(`1sslideritem${sliderIndex.value}url`));
        const sliderGroup = matchedSliderItems.find((s) => s.name.toLowerCase().includes(`1sslideritem${sliderIndex.value}group`));
        const sliderTitle = matchedSliderItems.find((s) => s.name.toLowerCase().includes(`1sslideritem${sliderIndex.value}title`));
        const sliderDescription = matchedSliderItems.find((s) => s.name.toLowerCase().includes(`1sslideritem${sliderIndex.value}description`));

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


      console.log("sliders", results);

      results.sort((a, b) => a.index - b.index);

      return results;
    },
  }
};
