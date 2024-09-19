// eslint-disable-next-line max-classes-per-file
class DataObjectError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class PropertyValidationError extends DataObjectError {
  constructor(property, propertyValue) {
    super(
      `Property Validation: An error has occured while trying to set ${property} to ${propertyValue}`
    );
    this.property = property;
    this.propertyValue = propertyValue;
  }
}

class InvalidPropertyError extends DataObjectError {
  constructor(property) {
    super(`Invalid property: Field ${property} not existed`);
    this.property = property;
  }
}

class OrderCreationError extends Error {
  constructor(errorCode, message, cause) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.cause = cause;
  }
}

module.exports = exports = {
  InvalidPropertyError,
  PropertyValidationError,
  OrderCreationError
};
