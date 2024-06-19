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

// const cleanData = (data) => {

//   return data;
// }

const clearData = async () => {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    await del('attribute_group').execute(connection);
    await del('attribute').execute(connection);
    await del('attribute_option').execute(connection);
    await del('product_description').execute(connection);
    await del('product_category').execute(connection);
    await del('product_attribute_value_index').execute(connection);
    await del('product').execute(connection);

    await commit(connection);
  } catch (error) {
    console.log("error: ", error);
    await rollback(connection);
  }
}

const bootstrapData = async (data) => {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    console.log("config: ", config);

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

    
    // Attribute Group
    const attributeGroupRecords = await attributeGroupData.rows.map(row => {
      return {
        name: row.name
      }
    });
    await insert('attribute_group').given(attributeGroupRecords).execute(connection);

    const attributeGroups = await select().from('attribute_group').execute(connection);

    // Attribute
    const attributeRecords = await attributeData.rows.map(row => {
      return {
        attribute_code: row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.code),
        attribute_name: row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.name),
        type: row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.type),
        is_required: row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.isRequired).toLowerCase() === 'yes' ? true : false,
        display_on_frontend: row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.isShowToCustomer).toLowerCase() === 'yes' ? true : false,
        sort_order: row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.sortOrder),
        is_filterable: row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.isFilterable).toLowerCase() === 'yes' ? true : false,
      }
    });
    for (const attribute of attributeRecords) {
      await insert('attribute').given(attribute).execute(connection);
    }

    const attributes = await select().from('attribute').execute(connection);

    // Attribute Option
    const attributeOptionRecords = await attributeOptionData.rows.map(row => {
      const foundedAttribute = attributes.find(
        attribute => attribute.attribute_code === row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.code)
      );
      if (!foundedAttribute) {
        throw new Error("Attribute not found");
      }

      return {
        attribute_id: foundedAttribute.attribute_id,
        attribute_code: row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.code),
        option_name: row.at(config.googleSheet.evershopData.sheetColumnIndex.attributeOption.value)
      }
    });
    for (const attributeOption of attributeOptionRecords) {
      await insert('attribute_option').given(attributeOption).execute(connection);
    }
    // Attribute Group Link
    const attributeGroupLinkRecords = await attributeOptionData.rows.map(row => {
      const foundedAttribute = attributes.find(
        attribute => attribute.attribute_code === row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.code)
      );
      if (!foundedAttribute) {
        throw new Error("Attribute not found");
      }

      const foundedAttributeGroup = attributeGroups.find(
        attributeGroup => attributeGroup.name === row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.group)
      );
      if (!foundedAttributeGroup) {
        throw new Error("Attribute Group not found");
      }

      return {
        attribute_id: foundedAttribute.attribute_id,
        group_id: foundedAttributeGroup.attribute_group_id,
      };
    });
    for (const attributeGroupLink of attributeGroupLinkRecords) {
      await insert('attribute_group_link').given(attributeGroupLink).execute(connection);
    }

    // Category
    const categoryRecords = await categoryData.rows.map(row => {
      return {
        category_code: row.at(config.googleSheet.evershopData.sheetColumnIndex.category.code),
        include_in_nav: row.at(config.googleSheet.evershopData.sheetColumnIndex.category.includeInNav).toLowerCase() === 'yes' ? true : false,
        position: null,
      }
    });
    for (const category of categoryRecords) {
      await insert('category').given(category).execute(connection);
    }

    // Category Description
    const categoryDescriptionRecords = await categoryData.rows.map(row => {
      const foundedCategory = categoryRecords.find(
        category => category.category_code === row.at(config.googleSheet.evershopData.sheetColumnIndex.category.code)
      );
      if (!foundedCategory) {
        throw new Error("Category not found");
      }

      return {
        category_description_category_id: foundedCategory.category_id,
        category_name: row.at(config.googleSheet.evershopData.sheetColumnIndex.category.name),
        description: row.at(config.googleSheet.evershopData.sheetColumnIndex.category.description),
        url_key: row.at(config.googleSheet.evershopData.sheetColumnIndex.category.seoUrlKey),
      }
    });
    for (const categoryDescription of categoryDescriptionRecords) {
      await insert('category_description').given(categoryDescription).execute(connection);
    }

    // Update Parent Category
    const categoryParentRecords = await categoryData.rows.map(row => {
      const foundedCategory = categoryRecords.find(
        category => category.category_code === row.at(config.googleSheet.evershopData.sheetColumnIndex.category.code)
      );
      if (!foundedCategory) {
        throw new Error("Category not found");
      }

      return {
        parent_id: row.at(config.googleSheet.evershopData.sheetColumnIndex.category.parent)
      }
    });
    for (const categoryParent of categoryParentRecords) {
      await update('category')
        .given(categoryParent)
        .where({
          category_code: row.at(config.googleSheet.evershopData.sheetColumnIndex.category.code)
        })
        .execute(connection);
    }

    // Product
    const productRecords = await productData.rows.map(row => {
      return {
        type: ProductType.variable.value,
        visibility: row.at(config.googleSheet.evershopData.sheetColumnIndex.product.visibility).toLowerCase() === 'visible' ? true : false,
        status: row.at(config.googleSheet.evershopData.sheetColumnIndex.product.status).toLowerCase() === 'enable' ? true : false,
        sku: row.at(config.googleSheet.evershopData.sheetColumnIndex.product.code),
        price: 0,
        weight: 0,
        tax_class: null,
        old_price: 0,
      }
    });
    for (const productRecord of productRecords) {
      await insert('product').given(productRecord).execute(connection);
    }
    const products = await select('product').execute(connection);

    // Product Variants
    const productVariantRecords = await productVariantData.rows.map(row => {
      const foundedParentProduct = products.find(
        product => product.sku === row.at(config.googleSheet.evershopData.sheetColumnIndex.productVariant.productCode)
      );
      if (!foundedParentProduct) {
        throw new Error(`Product with code ${row.at(config.googleSheet.evershopData.sheetColumnIndex.product.code)} not found`);
      }

      return {
        type: ProductType.simple.value,
        product_id: foundedProduct.product_id,
        sku: row.at(config.googleSheet.evershopData.sheetColumnIndex.productVariant.variantCode),
        price: parseInt(row.at(config.googleSheet.evershopData.sheetColumnIndex.productVariant.price)),
        weight: 0,
        tax_class: null,
        visibility: row.at(config.googleSheet.evershopData.sheetColumnIndex.product.visibility).toLowerCase() === 'visible' ? true : false,
        status: row.at(config.googleSheet.evershopData.sheetColumnIndex.product.status).toLowerCase() === 'enable' ? true : false,
        old_price: 0,
        parent_product_id: foundedParentProduct.product_id,
        parent_product_uuid: foundedParentProduct.uuid,
      }
    });
    for (const productVariant of productVariantRecords) {
      await insert('product_variant').given(productVariant).execute(connection);
    }

    // Product Description
    const productDescriptionRecords = await productData.rows.map((row, index) => {
      const foundedProduct = products.find(
        product => product.sku === row.at(config.googleSheet.evershopData.sheetColumnIndex.product.code)
      );
      if (!foundedProduct) {
        throw new Error(`Product with code ${row.at(config.googleSheet.evershopData.sheetColumnIndex.product.code)} not found`);
      }

      return {
        product_description_product_id: foundedProduct.product_id,
        name: row.at(config.googleSheet.evershopData.sheetColumnIndex.product.name),
        description: row.at(config.googleSheet.evershopData.sheetColumnIndex.product.description),
        // missing url key on sheet
        // url_key: row.at(config.googleSheet.evershopData.sheetColumnIndex.product.),
        url_key: index.toString(),
      }
    });
    for (const productDescription of productDescriptionRecords) {
      await insert('product_description').given(productDescription).execute(connection);
    }

    // Product Attribute
    const productAttributeRecords = await productData.rows.map(row => {
      const foundedProduct = products.find(
        product => product.sku === row.at(config.googleSheet.evershopData.sheetColumnIndex.product.code)
      );
      if (!foundedProduct) {
        throw new Error(`Product with code ${row.at(config.googleSheet.evershopData.sheetColumnIndex.product.code)} not found`);
      }

      const foundedAttribute = attributes.find(
        attribute => attribute.attribute_code === row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.code)
      );
      if (!foundedAttribute) {
        throw new Error(`Attribute with code ${row.at(config.googleSheet.evershopData.sheetColumnIndex.attribute.code)} not found`);
      }

      return {
        product_id: foundedProduct.product_id,
        attribute_id: foundedAttribute.attribute_id,
        option_text: row.at(config.googleSheet.evershopData.sheetColumnIndex.attributeOption.optionText),
      }
    });
    for (const productAttribute of productAttributeRecords) {
      await insert('product_attribute').given(productAttribute).execute(connection);
    }

    // Product Category
    const productCategoryRecords = await productCategoryData.rows.map(row => {
      return {
        product_id: row.product_id,
        category_id: row.category_id
      }
    });
    await insert('product_category').given(productCategoryRecords).execute(connection);

    await commit(connection);


  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

module.exports = {
  bootstrapData
}