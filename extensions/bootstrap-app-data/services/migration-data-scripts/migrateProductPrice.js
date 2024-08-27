const { getEvershopSheetData } = require('../getSheetData');
const {
  startTransaction,
  commit,
  rollback,
  update,
  select,
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const { config } = require('../../configs/config');
const { ProductType } = require('@evershop/evershop/src/modules/catalog/utils/enums/product-type');

const migrateProductPrice = async (data) => {
  const connection = await getConnection();
  await startTransaction(connection);

  const evershopSheetColumnIndex = config.googleSheet.evershopData.sheetColumnIndex;

  try {
    const productVariants = await select().from('product').where('type', '=', ProductType.simple.value).execute(connection);

    const {
      productVariantData,
    } = await getEvershopSheetData();

    // Category
    for (const variant of productVariants) {
      const foundVariantData = productVariantData.rows.find(row => row[evershopSheetColumnIndex.productVariant.variantCode] === variant.sku);
      if (!foundVariantData) {
        // throw new Error('Variant not found with code' + variant.sku);
        continue;
      }

      const updatedRecord = {
        price: parseFloat(foundVariantData[evershopSheetColumnIndex.productVariant.price]),
      };

        await update('product')
          .given(updatedRecord)
          .where('product.sku', '=', variant.sku)
          .execute(connection);
    }

    console.log("\n\n===== Finish update Product price =====");

    await commit(connection);

    console.log("\n\n===== DONE =====");

  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

module.exports = {
  migrateProductPrice
}