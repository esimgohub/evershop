module.exports = {
  Setting: {
    slidersSetting: (setting, { filter }) => {
      const sliders = setting
        .filter((s) => s.name.startsWith('slider'));

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
        })
      }

      results.filter((s) => s.visibility === true).sort((a, b) => a.sortOrder - b.sortOrder);

      return results;
    },
  }
};
