const orderService = require('../../services/order.service');

module.exports = async (request, response, delegate, next) => {
  const { orderCode, referenceOrderCode, status, orderDetails } = request.body;

  const updatedOrder = await orderService.updateOrderById(orderCode, {
    referenceOrderCode,
    status,
    orderDetails
  });

  response.status(200).json({
    status: 'success',
    data: updatedOrder
  });
};
