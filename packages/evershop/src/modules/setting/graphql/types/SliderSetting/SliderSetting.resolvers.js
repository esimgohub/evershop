module.exports = {
  Setting: {
    slidersSetting: (setting, { filter }) => {
      const sliders = setting
        .filter((s) => s.name.startsWith('slider'));

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
          group: sliderGroup ?? null,
          visibility: parseInt(sliderVisibility.value) === 1,
          imageUrl: sliderImageUrl.value,
          title: sliderTitle.value ?? '',
          description: sliderDescription.value ?? ''
        })
      }

      results.filter((s) => s.visibility === true).sort((a, b) => a.sortOrder - b.sortOrder);

      return results;
    },
  }
};
