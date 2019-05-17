import yup from "yup";
import { SchemaEntry, SchemaEntryError } from "./entry";
import { extendYupApi } from "./validator-bridge";
import { Base } from "./base";

function isObject(type) {
  return type && type === "object";
}

export function buildYup(schema, config = {}) {
  return new YupBuilder(schema, config).yupSchema;
}

function isObjectType(obj) {
  return obj === Object(obj);
}

class YupBuilder extends Base {
  schema: any;
  type: any;
  properties: any;
  required: any;
  shapeConfig: any;
  validSchema: boolean = false;

  constructor(schema, config = {}) {
    super(config);
    this.schema = schema;
    const type = this.getType(schema);
    const properties = this.getProps(schema);
    this.type = type;
    this.properties = properties;
    this.required = this.getRequired(schema);
    if (isObject(type)) {
      if (isObjectType(properties)) {
        const name = this.getName(schema);
        const properties = this.normalizeRequired(schema);
        const shapeConfig = this.propsToShape({ properties, name, config });
        this.shapeConfig = shapeConfig;
        this.validSchema = true;
        return;
      } else {
        this.error(
          `invalid schema: must have a properties object: ${JSON.stringify(
            properties
          )}`
        );
      }
    } else {
      this.error(`invalid schema: must be an object type, was: ${type}`);
    }
  }

  getRequired(obj) {
    const { getRequired } = this.config;
    return getRequired ? getRequired(obj) : obj.required || [];
  }

  getProps(obj) {
    return this.config.getProps(obj);
  }

  getType(obj) {
    return this.config.getType(obj);
  }

  getName(obj) {
    return this.config.getName(obj);
  }

  get yupSchema() {
    return yup.object().shape(this.shapeConfig);
  }

  normalizeRequired(schema?: any) {
    const properties = {
      ...this.properties
    };
    const required = [...this.required] || [];
    // this.logInfo("normalizeRequired", {
    //   properties,
    //   required
    // });
    const propKeys = Object.keys(properties);
    return propKeys.reduce((acc, key) => {
      // this.logInfo("normalizeRequired", {
      //   key
      // });
      const value = properties[key];
      const isRequired = required.indexOf(key) >= 0;
      value.required = this.isRequired(value) || isRequired;
      acc[key] = value;
      return acc;
    }, {});
  }

  isRequired(value) {
    return this.config.isRequired(value);
  }

  propsToShape({ properties, name, config }) {
    properties = properties || {
      ...this.properties
    };
    const keys = Object.keys(properties);
    return keys.reduce((acc, key) => {
      // this.logInfo("propsToShape", {
      //   key
      // });
      const value = properties[key];
      const yupSchemaEntry = this.propToValidatorSchemaEntry({
        name,
        key,
        value
      });
      this.logInfo("propsToShape", { key, yupSchemaEntry });
      acc[key] = yupSchemaEntry;
      return acc;
    }, {});
  }

  propToValidatorSchemaEntry({ name, key, value = {} }) {
    const entryBuilder =
      this.createYupSchemaEntry || this.config.createYupSchemaEntry;
    return entryBuilder({ name, key, value, config: this.config });
  }

  createYupSchemaEntry({ name, key, value, config }) {
    // return createYupSchemaEntry({ name, key, value, config });
    return new SchemaEntry({
      name,
      key,
      value,
      config
    }).toEntry();
  }
}
