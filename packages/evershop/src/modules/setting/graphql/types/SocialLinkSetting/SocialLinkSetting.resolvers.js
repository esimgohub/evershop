module.exports = {
  Setting: {
    social: (setting) => {
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
          icon: socialIcon.value,
          index: socialIndex.value
        });
      }
      
      socialResponses.sort((s1, s2) => s1.index - s2.index);

      return socialResponses;
    }
  }
};
