const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { getProductsBaseQuery } = require('@evershop/evershop/src/modules/catalog/services/getProductsBaseQuery');

module.exports = {
    Query: {
        product: async (_, { id }, { pool }) => {
            const query = getProductsBaseQuery();
            query.where('product.product_id', '=', id);
            const result = await query.load(pool);
            if (!result) {
                return null;
            } else {
                return camelCase(result);
            }
        }
    }
};