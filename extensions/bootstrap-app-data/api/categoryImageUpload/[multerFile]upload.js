const {
  INVALID_PAYLOAD,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { uploadFile } = require('../../services/uploadFile');
const { update, startTransaction, rollback, commit, select } = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');

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
    const files = await uploadFile(request.files, request.params[0] || '');

    const connection = await getConnection();
    await startTransaction(connection);
    
    try {
      for (const file of files) {
        const { name, url } = file;
        const [code, ext] = name.split('.');

        await update('category_description')
          .given({
            image: url
          })
          .where('url_key', '=', code.toUpperCase())
          .execute(connection);
      }

      await commit(connection);

    } catch (e) {
      await rollback(connection);
      throw e;
    }
    
    response.status(OK).json({
      data: {
        files
      },
      message: "Successfully"
    });
  }
};
