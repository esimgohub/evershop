const MobileDetect = require('mobile-detect');
const axios = require('axios');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

module.exports = async (request, response, delegate, next) => {
  try {
    const { token } = request.query;
 
    const md = new MobileDetect(request.headers['user-agent']);

    console.log(md.mobile(), md.tablet());

    const isMobilePhone = md.mobile() || md.tablet();
    console.log("isMobilePhone", isMobilePhone, md.mobile(), md.tablet());
    if (isMobilePhone) {
      const { token } = request.query;
      
      response.redirect(`gohub://app.com/?token=${token}`);
      return;
    }

    // Verify magic login
    console.log("full link url: ", `${request.protocol}://${request.get('host')}`);

    try {
      const verifiedTokenResponse = await axios.post(`${getConfig('shop.homeUrl')}/api/auth/magicLogin/verify`, {
        token,
      });
      const { data, error } = verifiedTokenResponse.data;
      if (error) {
        throw new Error(error.message);
      }

      const { email } = data;

      await request.loginCustomerViaMagicLogin(email, (error) => {
        if (error) {
          response.status(INTERNAL_SERVER_ERROR);
          response.json({
            error: {
              status: INTERNAL_SERVER_ERROR,
              message
            }
          });
        } 
        
        response.redirect(`/account/my-account`);
      })

      // Redirect to profile page
    } catch (error) {
      console.log("Verify magic token error: ", error);
      next(error);
    }
  } catch (e) {
    next(e);
  }
};
