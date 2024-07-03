const { config } = require('../configs/config');
const { googleSheetService } = require('../../google-sheet/google-sheet.service')

const getEvershopSheetData = async () => {
    const productData = await googleSheetService.getRowsData(
        config.googleSheet.evershopData.id, 
        config.googleSheet.evershopData.sheetColumns.product
    );

    const productVariantData = await googleSheetService.getRowsData(
        config.googleSheet.evershopData.id, 
        config.googleSheet.evershopData.sheetColumns.productVariant
    );

    const attributeGroupData = await googleSheetService.getRowsData(
        config.googleSheet.evershopData.id, 
        config.googleSheet.evershopData.sheetColumns.attributeGroup
    );

    const productCategoryData = await googleSheetService.getRowsData(
        config.googleSheet.evershopData.id, 
        config.googleSheet.evershopData.sheetColumns.productCategory
    );

    const attributeData = await googleSheetService.getRowsData(
        config.googleSheet.evershopData.id, 
        config.googleSheet.evershopData.sheetColumns.attribute
    );

    const attributeOptionData = await googleSheetService.getRowsData(
        config.googleSheet.evershopData.id, 
        config.googleSheet.evershopData.sheetColumns.attributeOptions
    );

    const categoryData = await googleSheetService.getRowsData(
        config.googleSheet.evershopData.id, 
        config.googleSheet.evershopData.sheetColumns.category
    );

    const currencyData = await googleSheetService.getRowsData(
        config.googleSheet.evershopData.id, 
        config.googleSheet.evershopData.sheetColumns.currency
    );


    return {
        productData,
        productVariantData,
        productCategoryData,
        attributeData,
        attributeOptionData,
        categoryData,
        currencyData,
        attributeGroupData,
    }
}

module.exports = {
    getEvershopSheetData
}