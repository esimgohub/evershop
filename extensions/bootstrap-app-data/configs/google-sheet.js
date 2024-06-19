const sheetColumnIndex = {
    product: {
        code: 0,
        typeOfSim: 1,
        status: 2,
        visibility: 3,
        productName: 4,
        description: 5,
        planType: 6,
        expiration: 7,
        sharing: 8,
        networkType: 9,
        networkOperator: 10,
        throttleSpeed: 11,
        dailyResetTime: 12,
        localEsim: 13,
        dataOnly: 14,
        multipleCountry: 15,
        kyc: 16,
        link: 17
    },
    productVariant: {
        productCode: 0,
        variantCode: 1,
        status: 2,
        visibility: 3,
        price: 4,
        dataAmount: 5,
        dayAmountUnit: 6,
        dayAmount: 7,
    },
    productCategory: {
        productCode: 0,
        categoryCode: 1,
    },
    attribute: {
        code: 0,
        name: 1,
        group: 2,
        type: 3,
        isRequired: 4,
        isFilterable: 5,
        isShowToCustomer: 6,
        sortOrder: 7,
    },
    attributeOption: {
        code: 0,
        value: 1,
    },
    category: {
        code: 0,
        name: 1,
        parentCode: 2,
        description: 3,
        image: 4,
        includeInNav: 5,
        type: 6,
        seoUrlKey: 7,
    },
    currency: {
        code: 0,
        rate: 1,
    },
    attributeGroup: {
        name: 0
    }
}

const evershopData = {
    id: process.env.EVERSHOP_DATA_SHEET_ID,
    sheetColumns: {
        product: 'product',
        productVariant: 'product_variant',
        productCategory: 'product_category',
        attribute: 'attributes',
        attributeOptions: 'attribute-options',
        category: 'category',
        currency: 'currencies',
        attributeGroup: 'attribute_group'
    },
    sheetColumnIndex
}

module.exports = {
    evershopData
}