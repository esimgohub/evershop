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
  // async init(filters = [], isAdmin = false) {
  //   // If the user is not admin, we need to filter out the out of stock products and the disabled products
  //   if (!isAdmin) {
  //     this.baseQuery.andWhere('product.status', '=', 1);
  //     if (getConfig('catalog.showOutOfStockProduct', false) === false) {
  //       this.baseQuery
  //         .andWhere('product_inventory.manage_stock', '=', false)
  //         .addNode(
  //           node('OR')
  //             .addLeaf('AND', 'product_inventory.qty', '>', 0)
  //             .addLeaf('AND', 'product_inventory.stock_availability', '=', true)
  //         );
  //     }
  //   }
  //   const currentFilters = [];
  //   // Attribute filter
  //   const filterableAttributes = await select()
  //     .from('attribute')
  //     .where('type', '=', 'select')
  //     .and('is_filterable', '=', 1)
  //     .execute(pool);
  //   // Apply the filters
  //   const productCollectionFilters = await getValue(
  //     'productCollectionFilters',
  //     [],
  //     {
  //       isAdmin,
  //       filterableAttributes
  //     }
  //   );

  //   productCollectionFilters.forEach((filter) => {
  //     const check = filters.find(
  //       (f) => f.key === filter.key && filter.operation.includes(f.operation)
  //     );
  //     if (filter.key === '*' || check) {
  //       filter.callback(
  //         this.baseQuery,
  //         check?.operation,
  //         check?.value,
  //         currentFilters
  //       );
  //     }
  //   });

  //   if (!isAdmin) {
  //     // Visibility. For variant group
  //     const copy = this.baseQuery.clone();
  //     // Get all group that have at lease 1 item visibile
  //     const visibleGroups = (
  //       await select('variant_group_id')
  //         .from('variant_group')
  //         .where('visibility', '=', 't')
  //         .execute(pool)
  //     ).map((v) => v.variant_group_id);

  //     if (visibleGroups) {
  //       // Get all invisible variants from current query
  //       copy
  //         .select('bool_or(product.visibility)', 'sumv')
  //         .select('max(product.product_id)', 'product_id')
  //         .andWhere('product.variant_group_id', 'IN', visibleGroups);
  //       copy.groupBy('product.variant_group_id');
  //       copy.orderBy('product.variant_group_id', 'ASC');
  //       copy.having('bool_or(product.visibility)', '=', 'f');
  //       const invisibleIds = (await copy.execute(pool)).map(
  //         (v) => v.product_id
  //       );

  //       if (invisibleIds.length > 0) {
  //         const n = node('AND');
  //         n.addLeaf('AND', 'product.product_id', 'IN', invisibleIds).addNode(
  //           node('OR').addLeaf('OR', 'product.visibility', '=', 't')
  //         );
  //         this.baseQuery.getWhere().addNode(n);
  //       } else {
  //         this.baseQuery.andWhere('product.visibility', '=', 't');
  //       }
  //     } else {
  //       this.baseQuery.andWhere('product.visibility', '=', 't');
  //     }
  //   } else {
  //     const onePerVariantGroupQuery = this.baseQuery.clone();
  //     onePerVariantGroupQuery.removeLimit();
  //     onePerVariantGroupQuery.select(
  //       sql(
  //         'DISTINCT ON (COALESCE(product.variant_group_id, random())) product.product_id',
  //         'product_id'
  //       )
  //     );
  //     onePerVariantGroupQuery.removeOrderBy();

      
  //     const onePerGroup = await onePerVariantGroupQuery.execute(pool);
  //     console.log("one per group sql: ", onePerGroup);

  //     this.baseQuery.andWhere(
  //       'product.product_id',
  //       'IN',
  //       onePerGroup.map((v) => v.product_id)
  //     );
  //   }

  //   // Clone the main query for getting total right before doing the paging
  //   const totalQuery = this.baseQuery.clone();
  //   totalQuery.select('COUNT(product.product_id)', 'total');
  //   totalQuery.removeOrderBy();
  //   totalQuery.removeLimit();

  //   this.currentFilters = currentFilters;
  //   this.totalQuery = totalQuery;
  // }

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
    let where = `"product"."type" = 'simple' AND "product"."visibility" = TRUE AND "product"."status" = TRUE`;

    // Clone the main query for getting total right before doing the paging
    
    // if (productFilter.categoryId) {
    //   const foundedCategory = await select()
    //     .from('category')
    //     .where('category_id', '=', productFilter.categoryId)
    //     .load(pool);

    //   const productCategories = await select()
    //     .from('product_category')
    //     .where('category_id', '=', foundedCategory.uuid)
    //     .execute(pool);

    //   this.baseQuery.andWhere("product.parent_product_uuid", "IN", productCategories.map(p => p.product_id));
    // }

    // if (productFilter.tripPeriod) {
    //   this.baseQuery.andWhere("attribute.attribute_code", "=", "day-amount")
    //   this.baseQuery.andWhere("product_attribute_value_index.option_text", ">=", productFilter.tripPeriod < 10 ? `0${productFilter.tripPeriod}` : productFilter.tripPeriod);
    // }

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

    // this.baseQuery.orderByCustomQuery(`CASE WHEN attribute_code = 'local-esim' AND product_attribute_value_index.option_text = 'Yes' THEN 1 WHEN attribute_code = 'local-esim' AND product_attribute_value_index.option_text = 'No' THEN 2 END`);

    // const rawQuery = await execute(pool, `
    //   SELECT
    //     product.*,
    //     product_description.*,
    //     product_attribute_value_index.option_text,
    //     attribute.*
    //   FROM
    //     "product"
    //     LEFT JOIN "product_description" AS "product_description" ON ("product_description"."product_description_product_id" = product.product_id)
    //     LEFT JOIN "product_image" AS "product_image" ON ("product_image"."product_image_product_id" = product.product_id
    //         AND "product_image"."is_main" = TRUE)
    //       INNER JOIN "product_attribute_value_index" AS "product_attribute_value_index" ON ("product_attribute_value_index"."product_id" = product.parent_product_id)
    //       LEFT JOIN "attribute" AS "attribute" ON ("attribute"."attribute_id" = product_attribute_value_index.attribute_id)
    //     WHERE (${where})
    //   ORDER BY
    //     CASE WHEN attribute_code = 'local-esim'
    //       AND product_attribute_value_index.option_text = 'Yes' THEN
    //       1
    //     WHEN attribute_code = 'local-esim'
    //       AND product_attribute_value_index.option_text = 'No' THEN
    //       2
    //     END,
    //     "product"."product_id" DESC
    //   LIMIT ${perPage} OFFSET ${offset * perPage}
    // `);
    
    const rawQuery = await execute(pool, `
      SELECT
          product.*,
          product_description.*,
          pa1.option_text AS pa1Text,
          pa2.option_text AS pa2Text,
          a1.*,
          a2.*
      FROM
          "product"
          LEFT JOIN "product_description" AS "product_description" ON ("product_description"."product_description_product_id" = product.product_id)
          LEFT JOIN "product_image" AS "product_image" ON ("product_image"."product_image_product_id" = product.product_id AND "product_image"."is_main" = TRUE)
          LEFT JOIN "product_attribute_value_index" AS "pa1" ON ("pa1"."product_id" = product.parent_product_id)
          LEFT JOIN "product_attribute_value_index" AS "pa2" ON ("pa2"."product_id" = product.product_id)
          LEFT JOIN "attribute" AS "a1" ON ("a1"."attribute_id" = pa1.attribute_id)
          LEFT JOIN "attribute" AS "a2" ON ("a2"."attribute_id" = pa2.attribute_id)
      WHERE (${where})
      ORDER BY
          CASE
              WHEN a1.attribute_code = 'local-esim' AND pa1.option_text = 'Yes' THEN 1
              WHEN a1.attribute_code = 'local-esim' AND pa1.option_text = 'No' THEN 2
          END,
          "product"."product_id" DESC
          LIMIT ${this.perPage} OFFSET ${this.offset * this.perPage}
    `);

    // const items = await this.baseQuery.execute(pool);

    // console.log("items [0]: ", items[0]);

    for (const item of rawQuery.rows) {
      const parentProductAttributeQuery = select().from('product_attribute_value_index');
      parentProductAttributeQuery
        .leftJoin('attribute')
        .on(
          'attribute.attribute_id',
          '=',
          'product_attribute_value_index.attribute_id'
        );
      parentProductAttributeQuery.where(
        'product_attribute_value_index.product_id',
        '=',
        item.parent_product_id
      );
      const matchedParentProductAttributes = await parentProductAttributeQuery.execute(pool);

      const productAttributeQuery = select().from('product_attribute_value_index');
      productAttributeQuery
        .leftJoin('attribute')
        .on(
          'attribute.attribute_id',
          '=',
          'product_attribute_value_index.attribute_id'
        );
      productAttributeQuery.where(
        'product_attribute_value_index.product_id',
        '=',
        item.product_id
      );
      const matchedProductAttributes = await productAttributeQuery.execute(pool);

      const dataTypeAttribute = matchedParentProductAttributes.find(a => a.attribute_code === 'data-type');
      const dayAmountAttribute = matchedProductAttributes.find(a => a.attribute_code === 'day-amount');
      const dataAmountAttribute = matchedProductAttributes.find(a => a.attribute_code === 'data-amount');
      const dataAmountUnitAttribute = matchedProductAttributes.find(a => a.attribute_code === 'data-amount-unit');
      const localEsimAttribute = matchedParentProductAttributes.find(a => a.attribute_code === 'local-esim');

      // Init attribute temp to sort by day-amount and total amount unit
      item.attributeTemp = {
        localEsim: localEsimAttribute.option_text,
        dayAmount: parseInt(dayAmountAttribute.option_text),
        totalDataAmount: dataTypeAttribute.option_text === DataType.DailyData ? parseInt(dayAmountAttribute.option_text) * parseInt(dataAmountAttribute.option_text) : parseInt(dataAmountAttribute.option_text),
        dataAmountUnit: dataAmountUnitAttribute.option_text
      };
    }

    const sortedItems = rawQuery.rows.sort((a, b) => {
      // Check if 'local esim' attribute exists and prioritize it
      if (a.attributeTemp.localEsim.toLowerCase() === "yes" && b.attributeTemp.localEsim.toLowerCase() === "no") {
        return -1; // 'a' has local esim, should come before 'b'
      }

      if (a.attributeTemp.localEsim.toLowerCase() === "no" && b.attributeTemp.localEsim.toLowerCase() === "yes") {
        return 1; // 'b' has local esim, should come before 'a'
      }

      if (a.attributeTemp.dayAmount !== b.attributeTemp.dayAmount) {
        return a.attributeTemp.dayAmount - b.attributeTemp.dayAmount;
      } 
      
      if (a.attributeTemp.totalDataAmount !== b.attributeTemp.totalDataAmount) {
        return a.attributeTemp.totalDataAmount - b.attributeTemp.totalDataAmount;
      } 

      // Compare data amount unit
      if (a.attributeTemp.dataAmountUnit.toLowerCase() === "mb" && b.attributeTemp.dataAmountUnit.toLowerCase() === "gb") {
        return -1; // "MB" should come before "GB"
      } else if (a.attributeTemp.dataAmountUnit.toLowerCase() === "gb" && b.attributeTemp.dataAmountUnit.toLowerCase() === "mb") {
        return 1; // "GB" should come after "MB"
      } else {
        return 0; // Same unit or both units are equal
      }
    }).map((row) => camelCase(row));

    // Remove attribute temp.
    sortedItems.forEach((item) => {
      delete item.attributeTemp
    });


    return sortedItems;
  }

  async adminItems() {
    this.baseQuery.removeLimit();

    const records = await this.baseQuery.execute(pool);

    return records.map((row) => camelCase(row));
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
