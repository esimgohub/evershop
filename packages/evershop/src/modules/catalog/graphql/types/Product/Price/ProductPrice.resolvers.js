module.exports = {
  Product: {
    price: (product) => {
      const price = parseFloat(product.price);
      return {
        regular: price,
        oldPrice: price + 20 // TODO: implement special price
      };
    }
  }
};
