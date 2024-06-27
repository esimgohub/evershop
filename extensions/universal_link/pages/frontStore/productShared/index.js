module.exports = async (request, response, delegate, next) => {
  try {
    next();
  } catch (e) {
    next(e);
  }
};
