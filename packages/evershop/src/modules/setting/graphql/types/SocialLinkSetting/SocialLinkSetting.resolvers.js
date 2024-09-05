module.exports = {
  Setting: {
    social: (setting) => {
      const socialConfigs = setting.filter(s => s.name.toLowerCase().startsWith("social"));

      const socialIndexes = socialConfigs.filter(s => s.name.toLowerCase().includes(`index`));

      const socialResponses = [];
      for (const socialIndex of socialIndexes) {
        const matchedSocialItems = socialConfigs.filter(s => s.name.toLowerCase().includes('social') && s.name.toLowerCase().includes(`social${socialIndex.value}`));

        const socialIcon = matchedSocialItems.find(s => s.name === `social${socialIndex.value}IconUrl`);
        const socialUrl = matchedSocialItems.find(s => s.name === `social${socialIndex.value}Url`);
        const socialVisibility = matchedSocialItems.find(s => s.name === `social${socialIndex.value}Visibility`);
        const socialSortOrder = matchedSocialItems.find(s => s.name === `social${socialIndex.value}SortOrder`);
        const socialName = matchedSocialItems.find(s => s.name === `social${socialIndex.value}Name`);

        socialResponses.push({
          url: socialUrl.value,
          icon: socialIcon.value,
          index: socialIndex.value,
          visibility: parseInt(socialVisibility.value) === 1,
          sortOrder: socialSortOrder.value,
          name: socialName.value
        });
      }
      
      socialResponses.sort((s1, s2) => s1.index - s2.index);

      return socialResponses;
    }
  }
};

