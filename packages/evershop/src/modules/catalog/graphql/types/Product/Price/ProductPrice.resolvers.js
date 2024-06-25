module.exports = {
  Product: {
    price: (product) => ({
        regular: product.price ? product.price : null,
        oldPrice: product.oldPrice ? product.oldPrice : null // TODO: implement special price
      })
  }
};
