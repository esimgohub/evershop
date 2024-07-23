const { getEvershopSheetData } = require('./getSheetData');
const {
  startTransaction,
  commit,
  rollback,
  insert,
  select,
  update,
  del
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const { config } = require('../configs/config');
const { ProductType } = require('@evershop/evershop/src/modules/catalog/utils/enums/product-type');
const { CategoryType } = require('@evershop/evershop/src/modules/catalog/utils/enums/category-type');

// const cleanData = (data) => {

//   return data;
// }

const clearData = async () => {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    console.log("===== Clear Attribute Group Data =====");
    await del('attribute_group').where('group_name', '!=', 'Default').execute(connection);

    console.log("===== Clean Variant Group Data =====");
    await del('variant_group').execute(connection);

    console.log("===== Clear Attribute Data =====");
    await del('attribute').execute(connection);

    console.log("===== Clear Attribute Option Data =====");
    await del('attribute_option').execute(connection);

    console.log("===== Clear Category Description Data =====");
    await del('category_description').execute(connection);

    console.log("===== Clear Product Category Data =====");
    await del('product_category').execute(connection);

    console.log("===== Clear Product Image =====");
    await del('product_image').execute(connection);

    console.log("===== Clear Category Data =====");
    await del('category').execute(connection);

    console.log("===== Clear Product Description Data =====");
    await del('product_description').execute(connection);
    
    console.log("===== Clear Product Attribute Data =====");
    await del('product_attribute_value_index').execute(connection);

    console.log("===== Clear Product Data =====");
    await del('product').execute(connection);

    console.log("===== Clear Currencies =====");
    await del('currency').execute(connection);

    await commit(connection);
  } catch (error) {
    console.log("error: ", error);
    await rollback(connection);
  }
}

const bootstrapData = async (data) => {
  const connection = await getConnection();
  await startTransaction(connection);

  const evershopSheetColumnIndex = config.googleSheet.evershopData.sheetColumnIndex;

  try {
    await clearData();
    
    // cleanData();
    
    const {
      productData,
      productVariantData,
      productCategoryData,
      attributeData,
      attributeOptionData,
      categoryData,
      currencyData,
      attributeGroupData,
    } = await getEvershopSheetData();

    // Currency
    console.log("\n\n===== Start bootstrap Currency =====");

    const currencyRecords = await currencyData.rows.map(row => {
      return {
        code: row[evershopSheetColumnIndex.currency.code],
        rate: parseFloat(row[evershopSheetColumnIndex.currency.rate]),
        signature: row[evershopSheetColumnIndex.currency.signature],
      }
    });
    for (const record of currencyRecords) {
      await insert('currency').given(record).execute(connection);
    }

    console.log("\n\n===== Finish bootstrap Attribute Group =====");
    

    console.log("\n\n===== Start bootstrap Attribute Group =====");

    // Attribute Group
    const attributeGroupRecords = await attributeGroupData.rows.map(row => {
      return {
        group_name: row[evershopSheetColumnIndex.attributeGroup.name],
      }
    });
    for (const attributeGroup of attributeGroupRecords) {
      await insert('attribute_group').given(attributeGroup).execute(connection);
    }
    const attributeGroups = await select().from('attribute_group').execute(connection);

    console.log("\n\n===== Finish bootstrap Attribute Group =====");
    

    console.log("\n\n===== Start bootstrap Attribute =====");

    // Attribute
    console.log("\n\n===== Start remove duplicate Attribute =====");
    const attributeResults = [];
    const attributeCodes = [];
    
    for (const attribute of attributeData.rows) {
      if (!attributeCodes.includes(attribute[config.googleSheet.evershopData.sheetColumnIndex.attribute.code])) {
        attributeResults.push(attribute);
      }
    }
    console.log("\n\n===== Finish remove duplicate Attribute =====");

    const attributeRecords = await attributeResults.map(row => {
      return {
        attribute_code: row[evershopSheetColumnIndex.attribute.code],
        attribute_name: row[evershopSheetColumnIndex.attribute.name],
        type: row[evershopSheetColumnIndex.attribute.type],
        is_required: row[evershopSheetColumnIndex.attribute.isRequired].toLowerCase() === 'yes' ? true : false,
        display_on_frontend: row[evershopSheetColumnIndex.attribute.isShowToCustomer].toLowerCase() === 'yes' ? true : false,
        sort_order: row[evershopSheetColumnIndex.attribute.sortOrder],
        is_filterable: row[evershopSheetColumnIndex.attribute.isFilterable].toLowerCase() === 'yes' ? true : false,
      }
    });
    for (const attribute of attributeRecords) {
      await insert('attribute').given(attribute).execute(connection);
    }

    console.log("\n\n===== Finish bootstrap Attribute =====");

    const attributes = await select().from('attribute').execute(connection);

    console.log("\n\n===== Start bootstrap Attribute Option =====");
    
    // Attribute Option
    const attributeOptionRecords = await attributeOptionData.rows.map(row => {
      const foundedAttribute = attributes.find(
        attribute => attribute.attribute_code === row[evershopSheetColumnIndex.attributeOption.code]
      );
      if (!foundedAttribute) {
        throw new Error("Attribute not found");
      }

      return {
        attribute_id: foundedAttribute.attribute_id,
        attribute_code: row[evershopSheetColumnIndex.attributeOption.code],
        option_text: row[evershopSheetColumnIndex.attributeOption.value] || ''
      }
    });
    for (const attributeOption of attributeOptionRecords) {
      await insert('attribute_option').given(attributeOption).execute(connection);
    }

    const attributeOptions = await select().from('attribute_option').execute(connection);

    console.log("\n\n===== Finish bootstrap Attribute Option =====");


    console.log("\n\n===== Start bootstrap Attribute Link =====");

    // Attribute Group Link
    const attributeGroupLinkRecords = [];
    const duplicatedAttributeGroupLinkRecords = [];
    for (const row of attributeData.rows) {
      const foundedAttribute = attributes.find(
        attribute => attribute.attribute_code === row[evershopSheetColumnIndex.attribute.code]
      );
      if (!foundedAttribute) {
        throw new Error(`Attribute ${row[evershopSheetColumnIndex.attribute.code]} not found in 'attribute' sheet`);
      }

      const foundedAttributeGroup = attributeGroups.find(
        attributeGroup => attributeGroup.group_name === row[evershopSheetColumnIndex.attribute.group]
      );
      if (!foundedAttributeGroup) {
        throw new Error(`Attribute Group ${row[evershopSheetColumnIndex.attribute.group]} not found in 'attribute' sheet`);
      }

      const hasNotExistInDuplicateRecords = duplicatedAttributeGroupLinkRecords.every(
        record => record.attribute_id !== foundedAttribute.attribute_id && record.group_id !== foundedAttributeGroup.group_id
      )
      if (hasNotExistInDuplicateRecords) {
        const record = {
          attribute_id: foundedAttribute.attribute_id,
          group_id: foundedAttributeGroup.attribute_group_id,
        };

        attributeGroupLinkRecords.push(record);

        duplicatedAttributeGroupLinkRecords.push(record);
      }
    }

    for (const attributeGroupLink of attributeGroupLinkRecords) {
      await insert('attribute_group_link').given(attributeGroupLink).execute(connection);
    }

    console.log("\n\n===== Finish bootstrap Attribute Link =====");


    console.log("\n\n===== Start bootstrap Category =====");

    // Category
    const categoryRecords = await categoryData.rows.map(row => {
      return {
        status: true,
        category_code: row[evershopSheetColumnIndex.category.code],
        category_type: row[evershopSheetColumnIndex.category.type],
        include_in_nav: row[evershopSheetColumnIndex.category.includeInNav].toLowerCase() === 'yes' ? true : false,
        position: null,
      }
    });
    const insertedCategories = [];
    for (const category of categoryRecords) {
      const insertedCategory = await insert('category').given(category).execute(connection);

      insertedCategory.category_code = category.category_code;

      insertedCategories.push(insertedCategory);
    }

    console.log("\n\n===== Finish bootstrap Category =====");

    console.log("\n\n===== Start bootstrap Category Description =====");

    // Category Description
    const categoryDescriptionRecords = await categoryData.rows.map(row => {
      const foundedCategory = insertedCategories.find(
        category => category.category_code === row[evershopSheetColumnIndex.category.code]
      );
      if (!foundedCategory) {
        throw new Error(`Category code ${row[evershopSheetColumnIndex.category.code]} not found in 'category' sheet`);
      }

      const foundedCategoryType = Object.values(CategoryType).find(ct => ct === row[evershopSheetColumnIndex.category.type]);
      if (!foundedCategoryType) {
        throw new Error(`Category type ${row[evershopSheetColumnIndex.category.type]} not found in 'category' sheet`);
      }

      return {
        category_description_category_id: foundedCategory.category_id,
        name: row[evershopSheetColumnIndex.category.name],
        short_description: '',
        category_type: foundedCategoryType,
        description: row[evershopSheetColumnIndex.category.description],
        url_key: row[evershopSheetColumnIndex.category.seoUrlKey],
      }
    });
    for (const categoryDescription of categoryDescriptionRecords) {
      await insert('category_description').given(categoryDescription).execute(connection);
    }
    console.log("\n\n===== Finish bootstrap Category Description =====");

    // Update Parent Category
    console.log("\n\n===== Start update Parent Category =====");
    const parentCategoryRecords = await categoryData.rows
      .filter(row => row[evershopSheetColumnIndex.category.parentCode] !== 'ROOT')
      .map(row => {
        const foundedCategory = insertedCategories.find(
          category => category.category_code === row[evershopSheetColumnIndex.category.code]
        );
        if (!foundedCategory) {
          throw new Error(`Category ${row[evershopSheetColumnIndex.category.code]} not found`);
        }

        const foundedParentCategory = insertedCategories.find(
          category => category.category_code === row[evershopSheetColumnIndex.category.parentCode]
        );
        if (!foundedParentCategory) {
          throw new Error(`Parent Category ${row[evershopSheetColumnIndex.category.parentCode]} not found`);
        }

        return {
          category_id: foundedCategory.category_id,
          parent_id: foundedParentCategory.category_id,
        }
      });

    for (const parentCategory of parentCategoryRecords) {

      await update('category')
        .given({
          parent_id: parentCategory.parent_id
        })
        .where('category_id', '=', parentCategory.category_id)
        .execute(connection);
    }
    console.log("\n\n===== Finish update Parent Category =====");


    // Variant Group
    const attributeGroup = {
      visibility: true,
    };
    const startProductVariantAttributeIndex = evershopSheetColumnIndex.productVariant.urlKey + 1;
    const variantGroupAttributeName = ['attribute_one', 'attribute_two', 'attribute_three', 'attribute_four', 'attribute_five'];

    for (let productAttributeIndex = startProductVariantAttributeIndex; productAttributeIndex < productVariantData.header.length; ++productAttributeIndex) {
      const foundedAttribute = attributes.find(
        attribute => attribute.attribute_code === productVariantData.header[productAttributeIndex]
      );
      if (!foundedAttribute) {
        throw new Error(`Product Variant Attribute ${productVariantData.header[productAttributeIndex]} not found in 'product-variant' sheet`);
      }

      const key = variantGroupAttributeName[productAttributeIndex - startProductVariantAttributeIndex];

      attributeGroup[key] = foundedAttribute.attribute_id;
    }

    const variantGroupRecords = [];
    const savedProducts = [];
    for (const product of productData.rows) {
      if (!savedProducts.includes(product[evershopSheetColumnIndex.product.code])) {
        const foundedAttributeGroup = attributeGroups.find(
          attributeGroup => attributeGroup.group_name === product[evershopSheetColumnIndex.product.attributeGroup]
        );
        if (!foundedAttributeGroup) {
          throw new Error(`Product Attribute Group ${product[evershopSheetColumnIndex.product.attributeGroup]} not found in 'product' sheet`);
        }

        variantGroupRecords.push({
          product_code: product[evershopSheetColumnIndex.product.code],
          attribute_group_id: foundedAttributeGroup.attribute_group_id,
          ...attributeGroup
        });

        savedProducts.push(product[evershopSheetColumnIndex.product.code]);
      }
    }

    const insertedVariantGroups = [];
    for (const variantGroup of variantGroupRecords) {
      const insertedVariantGroup = await insert('variant_group').given(variantGroup).execute(connection);

      insertedVariantGroup.product_code = variantGroup.product_code;

      insertedVariantGroups.push(insertedVariantGroup);
    }
    
    // Product
    console.log("\n\n===== Start bootstrap Product =====");

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

    const productRecords = productResults.map(row => {
      const foundedAttributeGroup = attributeGroups.find(
        group => group.group_name === row[evershopSheetColumnIndex.product.attributeGroup]
      );
      if (!foundedAttributeGroup) {
        throw new Error(`Attribute Group ${row[evershopSheetColumnIndex.product.attributeGroup]} not found`);
      }

      const foundedVariantGroup = insertedVariantGroups.find(
        group => group.product_code === row[evershopSheetColumnIndex.product.code]
      );
      if (!foundedVariantGroup) {
        throw new Error(`Variant Group with product code ${row[evershopSheetColumnIndex.product.code]} not found`);
      }

      return {
        type: ProductType.variable.value,
        variant_group_id: foundedVariantGroup.variant_group_id,
        group_id: foundedAttributeGroup.attribute_group_id, 
        visibility: row[evershopSheetColumnIndex.product.visibility].toLowerCase() === 'visible' ? true : false,
        status: row[evershopSheetColumnIndex.product.status].toLowerCase() === 'enable' ? true : false,
        sku: row[evershopSheetColumnIndex.product.code],
        price: null,
        weight: 0,
        tax_class: null,
        old_price: row[evershopSheetColumnIndex.product.oldPrice] ?
          parseFloat(row[evershopSheetColumnIndex.product.oldPrice]) :
          null,
      }
    });
    const insertedProducts = [];
    for (const productRecord of productRecords) {
      const insertedProduct = await insert('product').given(productRecord).execute(connection);

      insertedProducts.push(insertedProduct);
    }

    console.log("\n\n===== Finish bootstrap Product =====");

    
    // Product Variants
    console.log("\n\n===== Start bootstrap Product Variant =====");

    const productVariantRecords = await productVariantData.rows.map(row => {
      const foundedParentProduct = insertedProducts.find(
        product => product.sku === row[evershopSheetColumnIndex.productVariant.productCode]
      );
      if (!foundedParentProduct) {
        throw new Error(`Product with code ${row[evershopSheetColumnIndex.product.code]} not found`);
      }

      const foundedVariantGroup = insertedVariantGroups.find(
        group => group.product_code === row[evershopSheetColumnIndex.productVariant.productCode]
      );
      if (!foundedVariantGroup) {
        throw new Error(`Variant Group with product code ${row[evershopSheetColumnIndex.product.code]} not found`);
      }

      return {
        type: ProductType.simple.value,
        variant_group_id: foundedVariantGroup.variant_group_id,
        sku: row[evershopSheetColumnIndex.productVariant.variantCode],
        price: parseFloat(row[evershopSheetColumnIndex.productVariant.price]),
        weight: 0,
        group_id: foundedParentProduct.group_id,
        tax_class: null,
        visibility: row[evershopSheetColumnIndex.productVariant.visibility].toLowerCase() === 'visible' ? true : false,
        status: row[evershopSheetColumnIndex.productVariant.status].toLowerCase() === 'enable' ? true : false,
        old_price: row[evershopSheetColumnIndex.productVariant.oldPrice] ? 
          parseFloat(row[evershopSheetColumnIndex.productVariant.oldPrice]) : 
          null,
        parent_product_id: foundedParentProduct.product_id,
        parent_product_uuid: foundedParentProduct.uuid,
      }
    });
    for (const productVariant of productVariantRecords) {
      await insert('product').given(productVariant).execute(connection);
    }

    // Get All Product
    const products = await select().from('product').execute(connection);

    console.log("\n\n===== Finish bootstrap Product Variant =====");

    console.log("\n\n===== Start bootstrap Product Description =====");

    // Product Description
    const productDescriptionRecords = await productResults.map((row, index) => {
      const foundedProduct = products.find(
        product => product.sku === row[evershopSheetColumnIndex.product.code]
      );
      if (!foundedProduct) {
        throw new Error(`Product with code ${row[evershopSheetColumnIndex.product.code]} not found`);
      }

      return {
        product_code: foundedProduct.sku,
        product_description_product_id: foundedProduct.product_id,
        name: row[evershopSheetColumnIndex.product.productName],
        description: row[evershopSheetColumnIndex.product.description],
        url_key: row[evershopSheetColumnIndex.product.urlKey],
      }
    });
    const insertedProductDescriptions = [];
    for (const productDescription of productDescriptionRecords) {
      const insertedProductDescription = await insert('product_description').given(productDescription).execute(connection);

      insertedProductDescription.product_code = productDescription.product_code;

      insertedProductDescriptions.push(insertedProductDescription);
    }

    console.log("\n\n===== Finish bootstrap Product Description =====");

    // Save Product Variant Description
    console.log("\n\n===== Start bootstrap Product Variant Description =====");

    const productVariantDescriptionRecords = await productVariantData.rows.map((row) => {
      const foundedProductDescription = insertedProductDescriptions.find(
        pd => pd.product_code === row[evershopSheetColumnIndex.productVariant.productCode]
      )

      const foundedProductVariant = products.find(
        product => product.sku === row[evershopSheetColumnIndex.productVariant.variantCode]
      );
      if (!foundedProductVariant) {
        throw new Error(`Product Variant with code ${row[evershopSheetColumnIndex.productVariant.variantCode]} not found`);
      }

      return {
        product_description_product_id: foundedProductVariant.product_id,
        name: foundedProductDescription.name,
        description: foundedProductDescription.description,
        url_key: row[evershopSheetColumnIndex.productVariant.urlKey],
      }
    });
    for (const productVariantDescription of productVariantDescriptionRecords) {
      await insert('product_description').given(productVariantDescription).execute(connection);
    }

    console.log("\n\n===== Finish bootstrap Product Variant Description =====");

    // Product Attribute
    console.log("\n\n===== Start bootstrap Product Attribute =====");

    const startProductAttributeIndex = config.googleSheet.evershopData.sheetColumnIndex.product.urlKey + 1;
    const productAttributeRecords = [];
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
          const foundedAttributeOption = attributeOptions.find(attributeOption => {const optionValue = "Yes"; return attributeOption.option_text === optionValue});
          if (!foundedAttributeOption) {
            throw new Error(`Attribute option with code ${row[attributeIndex]} not found`);
          }

          productAttributeRecords.push({
            product_id: foundedProduct.product_id,
            attribute_id: foundedAttribute.attribute_id,
            option_id: foundedAttributeOption.attribute_option_id,
            option_text: row[attributeIndex],
          });
        }
        // Is Text Attribute
        else {
          productAttributeRecords.push({
            product_id: foundedProduct.product_id,
            attribute_id: foundedAttribute.attribute_id,
            option_text: row[attributeIndex],
          });
        }
      }
    }
    for (const productAttribute of productAttributeRecords) {
      await insert('product_attribute_value_index').given(productAttribute).execute(connection);
    }

    // Product Variant Attribute
    console.log("\n\n===== Start bootstrap Product Variant Attribute =====");

    const productVariantAttributeRecords = [];
    for (const row of productVariantData.rows) {
      const foundedProductVariant = products.find(
        product => product.sku === row[evershopSheetColumnIndex.productVariant.variantCode]
      );
      if (!foundedProductVariant) {
        throw new Error(`Product Variant with code ${row[evershopSheetColumnIndex.productVariant.variantCode]} not found`);
      }

      for (let attributeIndex = startProductVariantAttributeIndex; attributeIndex < productVariantData.header.length; ++attributeIndex) {
        const foundedAttribute = attributes.find(attribute => attribute.attribute_code === productVariantData.header[attributeIndex]);
        if (!foundedAttribute) {
          throw new Error(`Attribute with code '${productVariantData.header[attributeIndex]}' not found`);
        }

        const isSelectionAttribute = foundedAttribute.type === 'select';
        if (isSelectionAttribute) {
          const foundedAttributeOption = attributeOptions.find(attributeOption => {const optionValue = "Yes"; return attributeOption.option_text === optionValue});
          if (!foundedAttributeOption) {
            throw new Error(`Attribute option with code ${row[attributeIndex]} not found`);
          }

          productVariantAttributeRecords.push({
            product_id: foundedProductVariant.product_id,
            attribute_id: foundedAttribute.attribute_id,
            option_id: foundedAttributeOption.attribute_option_id,
            option_text: row[attributeIndex],
          });
        }
        // Is Text Attribute
        else {
          productVariantAttributeRecords.push({
            product_id: foundedProductVariant.product_id,
            attribute_id: foundedAttribute.attribute_id,
            option_text: row[attributeIndex],
          });
        }
      }
    }
    for (const productVariantAttribute of productVariantAttributeRecords) {
      await insert('product_attribute_value_index').given(productVariantAttribute).execute(connection);
    }

    console.log("\n\n===== Finish bootstrap Product Variant Attribute =====");

    
    // Product Category
    console.log("\n\n===== Start bootstrap Product Category =====");

    const productCategoryRecords = await productCategoryData.rows.map(row => {
      const foundedProduct = products.find(
        product => product.sku === row[evershopSheetColumnIndex.productCategory.productCode]
      )
      if (!foundedProduct) {
        throw new Error(`Product with code ${row[evershopSheetColumnIndex.productCategory.productCode]} not found in 'product-category' sheet`);
      }

      const foundedCategory = insertedCategories.find(
        category => category.category_code === row[evershopSheetColumnIndex.productCategory.categoryCode]
      );
      if (!foundedCategory) {
        throw new Error(`Category with code ${row[evershopSheetColumnIndex.productCategory.categoryCode]} not found in 'product-category' sheet`);
      }

      return {
        product_id: foundedProduct.uuid,
        category_id: foundedCategory.uuid
      }
    });
    for (const productCategory of productCategoryRecords) {
      await insert('product_category').given(productCategory).execute(connection);
    }
    console.log("\n\n===== Finish bootstrap Product Category =====");

    await commit(connection);

    console.log("\n\n===== DONE =====");

  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

module.exports = {
  bootstrapData
}