const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

const { select, node } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { getValue } = require('@evershop/evershop/src/lib/util/registry');
const { ProductType } = require('../utils/enums/product-type');
const { getTimeDifferenceInDays } = require('@evershop/evershop/src/lib/util/date');
const { PlanType } = require('../utils/enums/plan-type');

class ProductCollection {
  constructor(baseQuery) {
    this.baseQuery = baseQuery;
    this.baseQuery.orderBy('product.product_id', 'DESC');
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
    // this.baseQuery.orWhere('product.type', '=', ProductType.simple.value);
    // this.baseQuery.orWhere('product.status', '=', 1);

    // Implement: extend baseQuery to product type = simple or (product type = variable and product_parent_id = null or parent_product_uuid = null)
    // this.baseQuery
    //   .orWhere('product.type', '=', ProductType.simple.value)
    //   .addNode(
    //     node('AND')
    //       .addLeaf('AND', 'parent_product_id', 'IS NULL', null)
    //   );

    // If the user is not admin, we need to filter out the out of stock products and the disabled products
    if (!isAdmin) {
      this.baseQuery.orWhere('product.type', '=', ProductType.simple.value);
      this.baseQuery.andWhere('product.visibility', '=', true);
      this.baseQuery.andWhere('product.status', '=', true);
      // if (getConfig('catalog.showOutOfStockProduct', false) === false) {
      //   this.baseQuery
      //     .andWhere('product_inventory.manage_stock', '=', false)
      //     .addNode(
      //       node('OR')
      //         .addLeaf('AND', 'product_inventory.qty', '>', 0)
      //         .addLeaf('AND', 'product_inventory.stock_availability', '=', true)
      //     );
      // }
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

    if (productFilter.categoryId) {
      const productCategory = await select()
        .from('product_category')
        .where('category_id', '=', productFilter.categoryId)
        .execute(pool);

      this.baseQuery.andWhere("product.uuid", "IN", productCategory.map(p => p.product_id));
    }

    if (productFilter.tripPeriod) {
      this.baseQuery
        .innerJoin("product_attribute_value_index")
        .on(
          "product_attribute_value_index.product_id",
          "=",
          "product.product_id"
        )

      this.baseQuery
        .innerJoin("attribute")
        .on(
          "attribute.attribute_id",
          "=",
          "product_attribute_value_index.attribute_id"
        );

      this.baseQuery.andWhere("attribute.attribute_code", "=", "day-amount")
      this.baseQuery.andWhere("product_attribute_value_index.option_text", ">=", productFilter.tripPeriod < 10 ? `0${productFilter.tripPeriod}` : productFilter.tripPeriod);
    }

    // Clone the main query for getting total right before doing the paging
    const totalQuery = this.baseQuery.clone();
    totalQuery.select('COUNT(product.product_id)', 'total');
    totalQuery.removeOrderBy();
    totalQuery.removeLimit();

    this.currentFilters = currentFilters;
    this.totalQuery = totalQuery;
  }

  async items() {
    const items = await this.baseQuery.execute(pool);

    for (const item of items) {
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
      const matchedAttributes = await productAttributeQuery.execute(pool);

      const planTypeAttribute = matchedAttributes.find(a => a.attribute_code === 'plan-type');
      const dayAmountAttribute = matchedAttributes.find(a => a.attribute_code === 'day-amount');
      const dataAmountAttribute = matchedAttributes.find(a => a.attribute_code === 'data-amount');
      const dataAmountUnitAttribute = matchedAttributes.find(a => a.attribute_code === 'data-amount-unit');
      const localEsimAttribute = matchedAttributes.find(a => a.attribute_code === 'local-esim');

      // Init attribute temp to sort by day-amount and total amount unit
      item.attributeTemp = {
        localEsim: localEsimAttribute.option_text,
        dayAmount: parseInt(dayAmountAttribute.option_text),
        totalDataAmount: planTypeAttribute.option_text === PlanType.DailyData ? parseInt(dayAmountAttribute.option_text) * parseInt(dataAmountAttribute.option_text) : parseInt(dataAmountAttribute.option_text),
        dataAmountUnit: dataAmountUnitAttribute.option_text
      };
    }

    const sortedItems = items.sort((a, b) => {
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

  async total() {
    // Call items to get the total
    const total = await this.totalQuery.execute(pool);
    return total[0].total;
  }

  currentFilters() {
    return this.currentFilters;
  }
}

module.exports.ProductCollection = ProductCollection;
