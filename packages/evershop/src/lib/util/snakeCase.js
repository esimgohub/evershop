module.exports.snakeCase = (object) => {
  // Throw an error if the object is not an object
  if (typeof object !== 'object' && object !== null) {
    throw new Error('The object must be an object');
  }
  const newObject = {};
  Object.keys(object).forEach((key) => {
    // Convert the key to snake_case
    const newKey = key.replace(/([A-Z])/g, ($1) => `_${$1.toLowerCase()}`);
    // Add the new key to the new object
    newObject[newKey] = object[key];
  });

  return newObject;
};
