const { select, update } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { setContextValue } = require('@evershop/evershop/src/modules/graphql/services/contextHelper');

module.exports = async (request, response, delegate, next) => {
  // Check if any cart is associated with the session id
  const { sessionID, customer } = request.locals;

  const cart = await select()
    .from('cart')
    .where('sid', '=', sessionID)
    .andWhere('status', '=', 1)
    .load(pool);

  if (cart) {
    setContextValue(request, 'cartId', cart.uuid);
  } else {
    // Get the customer id from the session
    const customerID = customer?.customer_id || null;
    if (customerID) {
      // Check if any cart is associated with the customer id
      const customerCart = await select()
        .from('cart')
        .where('customer_id', '=', customerID)
        .andWhere('status', '=', 1)
        .load(pool);

      if (customerCart) {
        // Update the cart with the session id
        await update('cart')
          .given({ sid: sessionID })
          .where('uuid', '=', customerCart.uuid)
          .execute(pool);
        request.session.cartID = customerCart.uuid;
        setContextValue(request, 'cartId', customerCart.uuid);
      } else {
        setContextValue(request, 'cartId', undefined);
      }
    }
  }
  next();
};
