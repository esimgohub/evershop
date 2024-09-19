const axios = require('axios');
// const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
// const DeviceDetector = require('device-detector-js');

module.exports = async (request, response, delegate, next) => {
  try {
    next();

    // const { token } = request.query;
 
    // const md = new MobileDetect(request.headers['user-agent']);
    // const detector = new DeviceDetector();
    // const device = detector.parse(request.headers['user-agent']);

    // const isDesktop = device.device.type.toLowerCase() === 'desktop';
    // if (isDesktop) {
    //   // Redirect to google play store
    //   response.redirect('https://play.google.com/store/apps/details?id=com.gohub.esim&hl=en&pli=1')
    //   return;
    // }


    // console.log(device);

    // // const isMobilePhone = md.mobile() || md.tablet();
    // const isMobilePhone = device.device.type.toLowerCase() === 'smartphone';
    // console.log("isMobilePhone: ", isMobilePhone);

    // if (isMobilePhone) {
    //   try {
    //     const { token } = request.query;
        
    //     // response.redirect(`gohub://app.com/?token=${token}`);
    //     window.location.href = 'gohub://'
    //   }
    //   catch (e) {
    //     if (device.os.name.toLowerCase() !== 'android') {
    //     // Android device
    //       res.redirect(googlePlayUrl);
    //     } else if (device.os.name.toLowerCase() !== 'ios') {
    //       // iOS device
    //       res.redirect(appStoreUrl);
    //     } else {
    //       // Unsupported device
    //       res.send('This app is only available for Android and iOS devices.');
    //     }
    //   }
    //   finally {
    //     return;
    //   }
    // }

    
    // // Verify magic login

    // try {
    //   const verifiedTokenResponse = await axios.post(`${getConfig('shop.homeUrl', 'http://localhost:3000')}/api/auth/magicLogin/verify`, {
    //     token,
    //   });
    //   const { data, error } = verifiedTokenResponse.data;
    //   if (error) {
    //     throw new Error(error.message);
    //   }

    //   const { email } = data;

    //   await request.loginCustomerViaMagicLogin(email, (error) => {
    //     if (error) {
    //       response.status(INTERNAL_SERVER_ERROR);
    //       response.json({
    //         error: {
    //           status: INTERNAL_SERVER_ERROR,
    //           message
    //         }
    //       });
    //     } 
        
    //     response.redirect(`/account/my-account`);
    //   })

    //   // Redirect to profile page
    // } catch (error) {
    //   console.log("Verify magic token error: ", error);
    //   next(error);
    // }
  } catch (e) {
    next(e);
  }
};
