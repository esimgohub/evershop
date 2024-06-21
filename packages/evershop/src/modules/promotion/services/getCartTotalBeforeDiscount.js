/**
 * @param cart
 * @return float|int
 */
exports.getCartTotalBeforeDiscount = function getCartTotalBeforeDiscount(cart) {
  let total = 0;
  const items = cart.getActiveItems();
  items.forEach((item) => {
    total += item.getData('final_price') * item.getData('qty');
  });

  return total;
};
