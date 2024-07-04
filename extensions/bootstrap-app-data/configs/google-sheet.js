const { getConfig } = require("@evershop/evershop/src/lib/util/getConfig")

const sheetColumnIndex = {
    product: {
        code: 0,
        status: 1,
        visibility: 2,
        productName: 3,
        description: 4,
        attributeGroup: 5,
        urlKey: 6,
        planType: 7,
        expiration: 8,
        sharing: 9,
        networkType: 10,
        networkOperator: 11,
        throttleSpeed: 12,
        dailyResetTime: 13,
        localEsim: 14,
        dataOnly: 15,
        multipleCountry: 16,
        kyc: 17,
        link: 18,
        typeOfSim: 19,
        dataType: 20,
    },
    productVariant: {
        productCode: 0,
        variantCode: 1,
        status: 2,
        visibility: 3,
        price: 4,
        oldPrice: 5,
        urlKey: 6,
        dataAmount: 7,
        dataAmountUnit: 8,
        dayAmount: 9,
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
        signature: 2,
    },
    attributeGroup: {
        name: 0
    }
}

const evershopData = {
    id: getConfig("googleSheet.data.evershop.id"),
    sheetColumns: {
        product: 'product',
        productVariant: 'product-variant',
        productCategory: 'product-category',
        attribute: 'attributes',
        attributeOptions: 'attribute-options',
        category: 'category',
        currency: 'currencies',
        attributeGroup: 'attribute-group'
    },
    sheetColumnIndex
}

module.exports = {
    evershopData
}