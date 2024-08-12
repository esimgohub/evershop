const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

const { select, node, execute } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { getValue } = require('@evershop/evershop/src/lib/util/registry');
const { ProductType } = require('../utils/enums/product-type');
const { getTimeDifferenceInDays } = require('@evershop/evershop/src/lib/util/date');
const { DataType } = require('../utils/enums/data-type');

class ProductCollection {
  constructor(baseQuery) {
    this.baseQuery = baseQuery;
    this.baseQuery.orderBy('product.product_id', 'DESC');
    this.productFilter = {};
    this.offset = 1;
    this.perPage = 10;
  }

  /**
   *
   * @param {{key: String, operation: String, value: String}[]} filters
   * @param {boolean} isAdmin
   */

  async init(filters = [], productFilter = {}, isAdmin = false) {
    this.productFilter = productFilter;

    // If the user is not admin, we need to filter out the out of stock products and the disabled products
    if (!isAdmin) {
      this.baseQuery.orWhere('product.type', '=', ProductType.simple.value);
      this.baseQuery.andWhere('product.visibility', '=', true);
      this.baseQuery.andWhere('product.status', '=', true);

      this.baseQuery
        .innerJoin("product_attribute_value_index")
        .on(
          "product_attribute_value_index.product_id",
          "=",
          "product.parent_product_id"
        )

      this.baseQuery
        .innerJoin("attribute")
        .on(
          "attribute.attribute_id",
          "=",
          "product_attribute_value_index.attribute_id"
        );
    }
    else {
      this.baseQuery.orWhere('product.type', '=', ProductType.variable.value);
    }

    const currentFilters = [];
    // Attribute filter
    const filterableAttributes = await select()
      .from('attribute')
      .where('type', '=', 'select')
      .and('is_filterable', '=', 1)
      .execute(pool);
    // Apply the filters
    const productCollectionFilters = await getValue(
      'productCollectionFilters',
      [],
      {
        isAdmin,
        filterableAttributes
      }
    );

    productCollectionFilters.forEach((filter) => {
      const check = filters.find(
        (f) => f.key === filter.key && filter.operation.includes(f.operation)
      );
      if (filter.key === '*' || check) {
        filter.callback(
          this.baseQuery,
          check?.operation,
          check?.value,
          currentFilters
        );
      }
    });

    const page = productFilter.page ? parseInt(productFilter.page) : 1;
    this.offset = page - 1;
    this.perPage = productFilter.perPage ? parseInt(productFilter.perPage) : 10;
    this.baseQuery.limit(this.offset * this.perPage, this.perPage);

    const totalQuery = this.baseQuery.clone();
    totalQuery.select('COUNT(product.product_id)', 'total');
    totalQuery.removeOrderBy();
    totalQuery.removeLimit();

    this.currentFilters = currentFilters;
    this.totalQuery = totalQuery;
  }

  async items() {
    let where = `
    dayattr.attribute_code = 'day-amount'
        AND datatypeattr.attribute_code = 'data-type'
        AND dataattr.attribute_code = 'data-amount'
        AND "product"."type" = 'simple'
        AND "product"."visibility" = TRUE
        AND "product"."status" = TRUE
        AND a1.attribute_code = 'local-esim'
        AND dataunitattr.attribute_code = 'data-amount-unit'`;

    if (this.productFilter.categoryId) {
      const foundedCategory = await select()
        .from('category')
        .where('category_id', '=', this.productFilter.categoryId)
        .load(pool);

      if (!foundedCategory) {
        throw new Error(`Category ${this.productFilter.categoryId} not found`);
      }

      const productCategories = await select()
        .from('product_category')
        .where('category_id', '=', foundedCategory.uuid)
        .execute(pool);

      where += ` AND product.parent_product_uuid IN (${productCategories.map(p => `'${p.product_id}'`).join(',')})`;
    }

    if (this.productFilter.tripPeriod) {
      where += ` AND a2.attribute_code = 'day-amount' AND pa2.option_text >= ${this.productFilter.tripPeriod < 10 ? `'0${this.productFilter.tripPeriod}'` : `'${this.productFilter.tripPeriod}'`}`;
    }

    const sql = `
      SELECT DISTINCT
        product.product_id,
        product.*,
        product_description.*,
        LOWER(dataattrvalue.option_text) as data_amount_value,
        CASE WHEN pa1.option_text = 'Yes' THEN 1
        WHEN pa1.option_text = 'No' THEN
          CASE WHEN LOWER(dataattrvalue.option_text) = 'unlimited' THEN
            999999
          WHEN datatypeattrvalue.option_text = 'Daily Data' THEN
            CASE WHEN LOWER(dataunitattrvalue.option_text) = 'gb' THEN
              (CAST(dayattrvalue.option_text AS float8) * CAST(dataattrvalue.option_text AS float8)) * 1024
            ELSE
              CAST(dayattrvalue.option_text AS float8) * CAST(dataattrvalue.option_text AS float8)
              END
          WHEN datatypeattrvalue.option_text = 'Fixed Data' THEN
            CASE WHEN LOWER(dataunitattrvalue.option_text) = 'gb' THEN
              CAST(dataattrvalue.option_text AS float8) * 1024
            ELSE
              CAST(dataattrvalue.option_text AS float8)
              END
            END
        END AS order_column,
        CAST(dayattrvalue.option_text AS float8) AS day_amount_for_tie_breaker,
        CASE
        	WHEN LOWER(dataattrvalue.option_text) = 'unlimited' THEN 99999999
        	ELSE CAST(dataattrvalue.option_text AS float8)
        END
        AS data_amount_for_tie_breaker
      FROM
        "product"
        LEFT JOIN "product_description" AS "product_description" ON ("product_description"."product_description_product_id" = product.product_id)
        LEFT JOIN "product_image" AS "product_image" ON ("product_image"."product_image_product_id" = product.product_id
            AND "product_image"."is_main" = TRUE)
        LEFT JOIN "product_attribute_value_index" AS "pa1" ON ("pa1"."product_id" = product.parent_product_id)
        LEFT JOIN "product_attribute_value_index" AS "datatypeattrvalue" ON ("datatypeattrvalue"."product_id" = product.parent_product_id)
        LEFT JOIN "product_attribute_value_index" AS "pa2" ON ("pa2"."product_id" = product.product_id)
        LEFT JOIN "product_attribute_value_index" AS "dayattrvalue" ON ("dayattrvalue"."product_id" = product.product_id)
        LEFT JOIN "product_attribute_value_index" AS "dataattrvalue" ON ("dataattrvalue"."product_id" = product.product_id)
        LEFT JOIN "product_attribute_value_index" AS "dataunitattrvalue" ON ("dataunitattrvalue"."product_id" = product.product_id)
        LEFT JOIN "attribute" AS "a1" ON ("a1"."attribute_id" = pa1.attribute_id)
        LEFT JOIN "attribute" AS "a2" ON ("a2"."attribute_id" = pa2.attribute_id)
        LEFT JOIN "attribute" AS "datatypeattr" ON ("datatypeattr"."attribute_id" = datatypeattrvalue.attribute_id)
        LEFT JOIN "attribute" AS "dayattr" ON ("dayattr"."attribute_id" = dayattrvalue.attribute_id)
        LEFT JOIN "attribute" AS "dataattr" ON ("dataattr".attribute_id = dataattrvalue.attribute_id)
        LEFT JOIN "attribute" AS "dataunitattr" ON ("dataunitattr".attribute_id = dataunitattrvalue.attribute_id)
      WHERE (${where})
      ORDER BY
        order_column ASC,
        product.product_id DESC
      LIMIT ${this.perPage} OFFSET ${this.offset * this.perPage}
    `;
    const productByLocalEsim = await execute(pool, sql);

    console.log("sql: ", sql);

    const localEsimProducts = productByLocalEsim.rows.filter(
      product => product.order_column === 1,
    );

    const unLocalEsimProducts = productByLocalEsim.rows.filter(
      product => product.order_column !== 1,
    );

    const sortedProducts = [
      ...this.sortProductsByDataAmountAndDayAmountPriority(localEsimProducts),
      ...this.sortProductsByDataAmountAndDayAmountPriority(unLocalEsimProducts),
    ];

    return sortedProducts.map(row => camelCase(row));
  }

  async adminItems() {
    this.baseQuery.removeLimit();

    const records = await this.baseQuery.execute(pool);

    return records.map((row) => camelCase(row));
  }

  sortProductsByDataAmountAndDayAmountPriority(products) {
    return products.sort((a, b) => {
      if (a.data_amount_value === 'unlimited' && b.data_amount_value === 'unlimited') {
        return a.day_amount_for_tie_breaker - b.day_amount_for_tie_breaker;
      }

      // If products have the same total data amount
      if (a.order_column !== b.order_column) {
        return a.order_column - b.order_column;
      }

      // It will let data_amount from smallest to highest, for example: 20144 > 5231
      if (a.data_amount_for_tie_breaker !== b.data_amount_for_tie_breaker) {
        return a.data_amount_for_tie_breaker - b.data_amount_for_tie_breaker;
      }

      // If have same data_amount, it will compare day_amount from smallest to highest
      return a.day_amount_for_tie_breaker - b.day_amount_for_tie_breaker;
    });
  }

  async isCanLoadMore() {
    let where = `"product"."type" = 'simple' AND "product"."visibility" = TRUE AND "product"."status" = TRUE`;
    
    if (this.productFilter.categoryId) {
      const foundedCategory = await select()
        .from('category')
        .where('category_id', '=', this.productFilter.categoryId)
        .load(pool);

      if (!foundedCategory) {
        throw new Error(`Category ${this.productFilter.categoryId} not found`);
      }

      const productCategories = await select()
        .from('product_category')
        .where('category_id', '=', foundedCategory.uuid)
        .execute(pool);

      where += ` AND product.parent_product_uuid IN (${productCategories.map(p => `'${p.product_id}'`).join(',')})`;
    }

    if (this.productFilter.tripPeriod) {
      where += ` AND a2.attribute_code = 'day-amount' AND pa2.option_text >= ${this.productFilter.tripPeriod < 10 ? `'0${this.productFilter.tripPeriod}'` : `'${this.productFilter.tripPeriod}'`}`;
    }
    
    const nextOffset = this.offset + 1;
    
    const rawQuery = await execute(pool, `
      SELECT DISTINCT product.product_id
      FROM
          "product"
          LEFT JOIN "product_description" AS "product_description" ON ("product_description"."product_description_product_id" = product.product_id)
          LEFT JOIN "product_image" AS "product_image" ON ("product_image"."product_image_product_id" = product.product_id AND "product_image"."is_main" = TRUE)
          LEFT JOIN "product_attribute_value_index" AS "pa1" ON ("pa1"."product_id" = product.parent_product_id)
          LEFT JOIN "product_attribute_value_index" AS "pa2" ON ("pa2"."product_id" = product.product_id)
          LEFT JOIN "attribute" AS "a1" ON ("a1"."attribute_id" = pa1.attribute_id)
          LEFT JOIN "attribute" AS "a2" ON ("a2"."attribute_id" = pa2.attribute_id)
      WHERE (${where})
      LIMIT ${this.perPage} OFFSET ${nextOffset * this.perPage}
    `);

    return rawQuery.rows.length > 0;
  }

  async total() {
    // Call items to get the total
    // OLD VERSION
    // const total = await this.totalQuery.execute(pool);
    // return total[0].total;

    let where = `"product"."type" = 'simple' AND "product"."visibility" = TRUE AND "product"."status" = TRUE`;
    
    if (this.productFilter.categoryId) {
      const foundedCategory = await select()
        .from('category')
        .where('category_id', '=', this.productFilter.categoryId)
        .load(pool);

      if (!foundedCategory) {
        throw new Error(`Category ${this.productFilter.categoryId} not found`);
      }

      const productCategories = await select()
        .from('product_category')
        .where('category_id', '=', foundedCategory.uuid)
        .execute(pool);

      where += ` AND product.parent_product_uuid IN (${productCategories.map(p => `'${p.product_id}'`).join(',')})`;
    }

    if (this.productFilter.tripPeriod) {
      where += ` AND a2.attribute_code = 'day-amount' AND pa2.option_text >= ${this.productFilter.tripPeriod < 10 ? `'0${this.productFilter.tripPeriod}'` : `'${this.productFilter.tripPeriod}'`}`;
    }
    
    const rawQuery = await execute(pool, `
      SELECT DISTINCT product.product_id
      FROM
          "product"
          LEFT JOIN "product_description" AS "product_description" ON ("product_description"."product_description_product_id" = product.product_id)
          LEFT JOIN "product_image" AS "product_image" ON ("product_image"."product_image_product_id" = product.product_id AND "product_image"."is_main" = TRUE)
          LEFT JOIN "product_attribute_value_index" AS "pa1" ON ("pa1"."product_id" = product.parent_product_id)
          LEFT JOIN "product_attribute_value_index" AS "pa2" ON ("pa2"."product_id" = product.product_id)
          LEFT JOIN "attribute" AS "a1" ON ("a1"."attribute_id" = pa1.attribute_id)
          LEFT JOIN "attribute" AS "a2" ON ("a2"."attribute_id" = pa2.attribute_id)
      WHERE (${where})
    `);

    return rawQuery.rowCount;
  }

  currentFilters() {
    return this.currentFilters;
  }
}

module.exports.ProductCollection = ProductCollection;