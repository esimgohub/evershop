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
          const customerQuery = select('customer.customer_id', 'customer_id')
            .select('customer.uuid', 'uuid')
            .select('customer.status', 'status')
            .select('customer.first_name', 'first_name')
            .select('customer.last_name', 'last_name')
            .select('customer.email', 'email')
            .select('customer.avatar_url', 'avatar_url')
            .select('language.code', 'language_code')
            .select('language.name', 'language_name')
            .select('language.icon', 'language_icon')
            .select('currency.code', 'currency_code')
            .select('currency.name', 'currency_name')
            .from('customer');

          customerQuery
            .leftJoin('language', 'language')
            .on('customer.language_id', '=', 'language.id');

          customerQuery
            .leftJoin('currency', 'currency')
            .on('customer.currency_id', '=', 'currency.id');

          customerQuery
            .where('customer.customer_id', '=', customerSessionData.customerID)
            .andWhere('customer.status', '=', 1);

          currentCustomer = await customerQuery.load(pool);

          if (currentCustomer) {
            request.locals.customer = currentCustomer;
            currentCustomer = {
              customer_id: currentCustomer.customer_id,
              uuid: currentCustomer.uuid,
              email: currentCustomer.email,
              first_name: currentCustomer.first_name,
              last_name: currentCustomer.last_name,
              avatar_url: currentCustomer.avatar_url,
              status: currentCustomer.status,
              language_code: currentCustomer.language_code,
              currency_code: currentCustomer.currency_code
            };
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
