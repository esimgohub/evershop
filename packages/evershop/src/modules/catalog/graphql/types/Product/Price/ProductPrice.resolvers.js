module.exports = {
  Product: {
    price: (product) => {
      const price = parseFloat(product.price);
      return {
        regular: price,
        special: price - 20 // TODO: implement special price
      };
    }
  }
};
