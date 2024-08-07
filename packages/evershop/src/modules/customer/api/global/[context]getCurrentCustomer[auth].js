const sessionStorage = require('connect-pg-simple');
const util = require('util');
const { select } = require('@evershop/postgres-query-builder');
const session = require('express-session');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const {
  getFrontStoreSessionCookieName
} = require('../../../auth/services/getFrontStoreSessionCookieName');
const { setContextValue } = require('../../../graphql/services/contextHelper');

/**
 * This is the session based authentication middleware.
 * We do not implement session middleware on API routes,
 * instead we only load the session from the database and set the customer in the context.
 * @param {*} request
 * @param {*} response
 * @param {*} delegate
 * @param {*} next
 * @returns
 */
module.exports = async (request, response, delegate, next) => {
  // Check if the customer is authenticated
  // if yes we assume previous authentication middleware has set the customer in the context
  let currentCustomer = request.getCurrentCustomer();
  if (!currentCustomer) {
    try {
      // Get the sesionID cookies
      const cookies = request.signedCookies;
      const storeFrontSessionCookieName = getFrontStoreSessionCookieName();
      // Check if the sessionID cookie is present
      const sessionID = cookies[storeFrontSessionCookieName];
      if (sessionID) {
        const storage = new (sessionStorage(session))({
          pool
        });
        // Load the session using session storage
        const getSession = util.promisify(storage.get).bind(storage);
        const customerSessionData = await getSession(sessionID);
        if (customerSessionData) {
          currentCustomer = await select()
            .from('customer')
            .where('customer_id', '=', customerSessionData.customerID)
            .and('status', '=', 1)
            .load(pool);

          if (currentCustomer) {
            request.locals.customer = currentCustomer;
            setContextValue(request, 'customer', currentCustomer);
          }
        }
        // We also keep the session id in the request.
        // This is for anonymous customer authentication.
        request.locals.sessionID = sessionID;
      }
    } catch (e) {
      // Do nothing, the customer is not logged in
    }
  }
  next();
};
