module.exports = async (request, response, delegate, next) => {
  try {
    const { token } = request.query;

    response.redirect(`gohub://app.com/?token=${token}`);
  } catch (e) {
    next(e);
  }
};
