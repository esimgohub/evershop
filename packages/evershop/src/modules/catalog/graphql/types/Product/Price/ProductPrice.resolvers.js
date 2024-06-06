module.exports = {
  Product: {
    price: (product) => {
      console.log("price ne: ", product);

      const price = parseFloat(product.price);
      return {
        regular: price,
        oldPrice: product.oldPrice ? product.oldPrice : null // TODO: implement special price
      };
    }
  }
};
