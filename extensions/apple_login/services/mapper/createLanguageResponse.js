module.exports.createLanguageResponse = (language) => {
  return {
    code: language.code,
    name: language.name,
    icon: language.icon
  };
};
