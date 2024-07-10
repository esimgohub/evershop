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

const updateProductAttributes = async (data) => {
  const connection = await getConnection();
  await startTransaction(connection);

  const evershopSheetColumnIndex = config.googleSheet.evershopData.sheetColumnIndex;

  try {
    const products = await select().from('product').where('type', '=', ProductType.variable.value).execute(connection);
    const attributes = await select().from('attribute').execute(connection);
    const attributeOptions = await select().from('attribute_option').execute(connection);

    const {
      productData,
    } = await getEvershopSheetData();

    console.log("\n\n== Start remove duplicate Product ==");
    const productResults = [];
    const productCodes = [];
    
    for (const product of productData.rows) {
      if (!productCodes.includes(product[config.googleSheet.evershopData.sheetColumnIndex.product.code])) {
        productResults.push(product);

        productCodes.push(product[config.googleSheet.evershopData.sheetColumnIndex.product.code]);
      }
    }
    console.log("\n\n== Finish remove duplicate Product ==");

    // Product Attribute
    console.log("\n\n===== Start bootstrap Product Attribute =====");

    const startProductAttributeIndex = config.googleSheet.evershopData.sheetColumnIndex.product.urlKey + 1;
    const updatedAttributeRecords = [];
    for (const row of productResults) {
      const foundedProduct = products.find(
        product => product.sku === row[evershopSheetColumnIndex.product.code]
      );
      if (!foundedProduct) {
        throw new Error(`Product with code ${row[evershopSheetColumnIndex.product.code]} not found`);
      }

      for (let attributeIndex = startProductAttributeIndex; attributeIndex < productData.header.length; ++attributeIndex) {
        const foundedAttribute = attributes.find(attribute => attribute.attribute_code === productData.header[attributeIndex]);
        if (!foundedAttribute) {
          throw new Error(`Attribute with code '${productData.header[attributeIndex]}' not found`);
        }

        const isSelectionAttribute = foundedAttribute.type === 'select';
        if (isSelectionAttribute) {
          const foundedAttributeOption = attributeOptions.find(attributeOption => {
            const optionValue = "Yes"; 
            
            return attributeOption.option_text === optionValue
          });

          if (!foundedAttributeOption) {
            throw new Error(`Attribute option with code ${row[attributeIndex]} not found`);
          }

          updatedAttributeRecords.push({
            product_id: foundedProduct.product_id,
            attribute_id: foundedAttribute.attribute_id,
            option_id: foundedAttributeOption.attribute_option_id,
            option_text: row[attributeIndex],
          });
        }
        // Is Text Attribute
        else {
          updatedAttributeRecords.push({
            product_id: foundedProduct.product_id,
            attribute_id: foundedAttribute.attribute_id,
            option_text: row[attributeIndex],
          });
        }
      }
    }
    for (const productAttribute of updatedAttributeRecords) {
      console.log("productAttribute: ", productAttribute);

      await update('product_attribute_value_index')
        .given({
          attribute_id: productAttribute.attribute_id,
          option_text: productAttribute.option_text
        })
        .where('product_id', '=', productAttribute.product_id)
        .execute(connection);
    }

    // Product Variant Attribute
    console.log("\n\n===== Update Product Variant Attribute =====");

    console.log("\n\n===== Finish update Product Attribute =====");

    await commit(connection);

    console.log("\n\n===== DONE =====");

  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

module.exports = {
  updateProductAttributes
}