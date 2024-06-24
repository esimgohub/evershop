const DataAmount = {
    GB: 'GB',
    MB: 'MB',
    TB: 'TB'
}

module.exports.calculateDataAmountUnit = (totalDataAmount, currentDataAmountUnit) => {
    // If currentDataAmountUnit is MB, and the total amount greater than 1024MB, I want to convert it to GB, and so on
    if (currentDataAmountUnit === DataAmount.MB && totalDataAmount > 1024) {
        return DataAmount.GB;
    } else if (currentDataAmountUnit === DataAmount.GB && totalDataAmount > 1024) {
        return DataAmount.TB;
    } 
    
    return currentDataAmountUnit;
};