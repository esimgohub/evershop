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

const migratePopularAndSortOrder = async (data) => {
  const connection = await getConnection();
  await startTransaction(connection);

  const evershopSheetColumnIndex = config.googleSheet.evershopData.sheetColumnIndex;

  try {
    const categoriesQuery = await select().from('category');

    categoriesQuery.innerJoin('category_description').on('category_description.category_description_category_id', '=', 'category.category_id');

    const categories = await categoriesQuery.execute(connection);

    const {
      categoryData,
    } = await getEvershopSheetData();

    // Category
    for (const category of categories) {
      const foundCategoryData = categoryData.rows.find(row => row[evershopSheetColumnIndex.category.code] === category.url_key);
      if (!foundCategoryData) {
        throw new Error('Category not found with code' + category.url_key);
      }

      const updatedRecord = {
        is_popular: foundCategoryData[evershopSheetColumnIndex.category.isPopular].toLowerCase() === 'yes' ? true : false,
        sort_order: parseInt(foundCategoryData[evershopSheetColumnIndex.category.sortOrder]),
      };

      const updatedCategory = 
        await update('category')
          .given(updatedRecord)
          .where('category.category_id', '=', category.category_id)
          .execute(connection);
    }

    console.log("\n\n===== Finish update Category =====");

    await commit(connection);

    console.log("\n\n===== DONE =====");

  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

module.exports = {
  migratePopularAndSortOrder
}