const {
  INVALID_PAYLOAD,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { uploadFile } = require('../../services/uploadFile');
const { update, startTransaction, rollback, commit, insert, select } = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const { ProductType } = require('@evershop/evershop/src/modules/catalog/utils/enums/product-type');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  if (!request.files || request.files.length === 0) {
    response.status(INVALID_PAYLOAD).json({
      error: {
        status: INVALID_PAYLOAD,
        message: 'No image was provided'
      }
    });
  } else {
    // Instance return to the client
    response.status(OK).json({
      message: "Uploading..."
    });

    console.log(`=== Start upload files ===\n`);

    const files = await uploadFile(request.files, request.params[0] || '');

    console.log(`=== Upload files finished ===\n\n`);

    const connection = await getConnection();
    await startTransaction(connection);

    try {
      console.log(`=== Start prepare product image data ===\n`);

      const variableProducts = await select()
          .from('product')
          .where('type', '=', ProductType.variable.value)
          .execute(connection);


      const insertingRecords = [];
      for (const product of variableProducts) {
        insertingRecords.push({
          product_image_product_id: product.product_id,
          origin_image: files[0].url,
          is_main: true
        })
      }

      console.log(`=== Prepare product image data finished ===\n\n`);

      console.log(`=== Start to save product image to DB ===\n`);

      for (const insertingRecord of insertingRecords) {
        await insert('product_image')
          .given(insertingRecord)
          .execute(connection);
      }

      await commit(connection);

      console.log(`=== Save product image to DB finished ===\n\n`);

      console.log("=== DONE ===");

    } catch (e) {
      await rollback(connection);
      throw e;
    }
  }
};
