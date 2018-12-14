const { YupMixed } = require("../mixed");
const { buildYup } = require("../..");

class ObjectHandler {
  constructor(config) {
    this.config = config;
  }

  isObject(obj) {
    return this.config.isObject(obj);
  }

  handle(obj) {
    return this.isObject(obj) && YupObject.create(obj).createSchemaEntry();
  }
}

function toYupObject(obj, config = {}) {
  return obj && new ObjectHandler(config).handle(obj);
}

// TODO: Allow recursive schema
// Note: all types inherit from mixed
// See https://github.com/jquense/yup#mixed
class YupObject extends YupMixed {
  constructor(obj) {
    super(obj);
    this.type = "object";
    this.validatorTypeApi = this.yup.object();
    this.properties = this.value.properties;
  }

  static create(obj) {
    return new YupObject(obj);
  }

  convert() {
    if (!this.properties) return this;
    this.noUnknown();
    this.camelCase().constantCase();

    // recursive definition
    if (this.value) {
      const schema = buildYup(this.value);
      this.base.shape(schema);
    }
    return this;
  }

  camelCase() {
    return this.addConstraint("camelCase");
  }

  constantCase() {
    return this.addConstraint("constantCase");
  }

  noUnknown() {
    const { noUnknown, propertyNames } = this.value;
    const $names = noUnknown || propertyNames;
    const newBase =
      $names &&
      this.base.noUnknown(
        $names,
        this.valErrMessage("propertyNames") || this.valErrMessage("noUnknown")
      );
    this.validatorTypeApi = newBase || this.base;
    return this;
  }
}

module.exports = {
  toYupObject,
  YupObject,
  ObjectHandler
};