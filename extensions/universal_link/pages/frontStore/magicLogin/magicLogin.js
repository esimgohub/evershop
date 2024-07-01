const MobileDetect = require('mobile-detect');

module.exports = async (request, response, delegate, next) => {
  try {
    const md = new MobileDetect(request.headers['user-agent']);

    console.log(md.mobile(), md.tablet());

    const isMobilePhone = md.mobile() || md.tablet();
    console.log("isMobilePhone", isMobilePhone, md.mobile(), md.tablet());
    if (isMobilePhone) {
      const { token } = request.query;
      
      response.redirect(`gohub://app.com/?token=${token}`);
    }
    else {
      next();
    }
  } catch (e) {
    next(e);
  }
};
