module.exports.camelCase = (object) => {
  // Throw error if the object is not an object
  if (typeof object !== 'object' && object !== null) {
    throw new Error('The object must be an object');
  }
  const newObject = {};
  Object.keys(object).forEach((key) => {
    if(key === 'category_id') {
      console.log('key 1', object[key], typeof object[key])
    }
    // Convert the key to camelCase
    const newKey = key.replace(/([-_][a-zA-Z0-9])/gi, ($1) =>
      $1.toUpperCase().replace('-', '').replace('_', '')
    );
    // Add the new key to the new object
    newObject[newKey] = object[key];
    if(key === 'category_id') {
      console.log('key 2', newObject[key], typeof newObject[key])
    }
  });
  console.log('key 3', newObject)

  return newObject;
};
