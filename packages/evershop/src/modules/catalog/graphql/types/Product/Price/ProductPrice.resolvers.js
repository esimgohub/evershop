module.exports = {
  Product: {
    price: (product) => {
      return {
        regular: product.price ? product.price : null,
        oldPrice: product.oldPrice ? product.oldPrice : null // TODO: implement special price
      };
    }
  }
};
