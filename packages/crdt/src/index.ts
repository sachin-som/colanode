import { z } from 'zod';
import * as Y from 'yjs';
import { ZodText } from '@colanode/core';
import { isEqual } from 'lodash';
import { diffChars } from 'diff';

export const applyCrdt = (
  schema: z.ZodSchema,
  attributes: z.infer<typeof schema>,
  attributesMap: Y.Map<any>
) => {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error('Schema must be a ZodObject');
  }

  applyObjectChanges(schema, attributes, attributesMap);

  const parseResult = schema.safeParse(attributesMap.toJSON());
  if (!parseResult.success) {
    throw new Error('Invalid attributes', parseResult.error);
  }
};

const applyObjectChanges = (
  schema: z.ZodObject<any, any, any, any>,
  attributes: any,
  yMap: Y.Map<any>
) => {
  for (const [key, value] of Object.entries(attributes)) {
    if (value === null) {
      yMap.set(key, null);
      continue;
    }

    const schemaField = extractType(schema.shape[key], value);
    if (schemaField instanceof z.ZodObject) {
      if (typeof value !== 'object') {
        throw new Error('Value must be an object');
      }

      let nestedMap = yMap.get(key);
      if (!(nestedMap instanceof Y.Map)) {
        nestedMap = new Y.Map();
        yMap.set(key, nestedMap);
      }

      applyObjectChanges(schemaField, value, nestedMap);
    } else if (schemaField instanceof z.ZodRecord) {
      if (typeof value !== 'object') {
        throw new Error('Value must be an object');
      }

      let nestedMap = yMap.get(key);
      if (!(nestedMap instanceof Y.Map)) {
        nestedMap = new Y.Map();
        yMap.set(key, nestedMap);
      }

      applyRecordChanges(schemaField, value, nestedMap);
    } else if (schemaField instanceof z.ZodArray) {
      if (!Array.isArray(value)) {
        throw new Error('Value must be an array');
      }

      let yArray = yMap.get(key);
      if (!(yArray instanceof Y.Array)) {
        yArray = new Y.Array();
        yMap.set(key, yArray);
      }

      applyArrayChanges(schemaField, value, yArray);
    } else if (schemaField instanceof ZodText) {
      if (typeof value !== 'string') {
        throw new Error('Value must be a string');
      }

      let yText = yMap.get(key);
      if (!(yText instanceof Y.Text)) {
        yText = new Y.Text();
        yMap.set(key, yText);
      }

      applyTextChanges(value, yText);
    } else {
      const currentValue = yMap.get(key);

      if (!isEqual(currentValue, value)) {
        yMap.set(key, value);
      }
    }
  }

  const deletedKeys = Array.from(yMap.keys()).filter(
    (key) => !attributes.hasOwnProperty(key)
  );

  for (const key of deletedKeys) {
    yMap.delete(key);
  }
};

const applyArrayChanges = (
  schemaField: z.ZodArray<any>,
  value: Array<any>,
  yArray: Y.Array<any>
) => {
  const itemSchema = extractType(schemaField.element, value);
  const length = value.length;

  for (let i = 0; i < length; i++) {
    const item = value[i];

    if (item === null) {
      yArray.delete(i, 1);
      yArray.insert(i, [null]);
      continue;
    }

    if (itemSchema instanceof z.ZodObject) {
      if (yArray.length <= i) {
        const nestedMap = new Y.Map();
        yArray.insert(i, [nestedMap]);
      }

      let nestedMap = yArray.get(i);
      if (!(nestedMap instanceof Y.Map)) {
        nestedMap = new Y.Map();
        yArray.delete(i, 1);
        yArray.insert(i, [nestedMap]);
      }

      applyObjectChanges(itemSchema, item, nestedMap);
    } else if (itemSchema instanceof z.ZodRecord) {
      if (yArray.length <= i) {
        const nestedMap = new Y.Map();
        yArray.insert(i, [nestedMap]);
      }

      let nestedMap = yArray.get(i);
      if (!(nestedMap instanceof Y.Map)) {
        nestedMap = new Y.Map();
        yArray.delete(i, 1);
        yArray.insert(i, [nestedMap]);
      }

      applyRecordChanges(itemSchema, item, nestedMap);
    } else if (itemSchema instanceof z.ZodRecord) {
      if (yArray.length <= i) {
        const nestedMap = new Y.Map();
        yArray.insert(i, [nestedMap]);
      }

      let nestedMap = yArray.get(i);
      if (!(nestedMap instanceof Y.Map)) {
        nestedMap = new Y.Map();
        yArray.delete(i, 1);
        yArray.insert(i, [nestedMap]);
      }

      applyRecordChanges(itemSchema, item, nestedMap);
    } else if (itemSchema instanceof ZodText) {
      if (yArray.length <= i) {
        const yText = new Y.Text();
        yArray.insert(i, [yText]);
      }

      let yText = yArray.get(i);
      if (!(yText instanceof Y.Text)) {
        yText = new Y.Text();
        yArray.delete(i, 1);
        yArray.insert(i, [yText]);
      }

      applyTextChanges(item, yText);
    } else {
      if (yArray.length <= i) {
        yArray.insert(i, [item]);
      } else {
        const currentItem = yArray.get(i);
        if (!isEqual(currentItem, item)) {
          yArray.delete(i);
          yArray.insert(i, [item]);
        }
      }
    }
  }

  if (yArray.length > length) {
    yArray.delete(yArray.length, yArray.length - length);
  }
};

const applyRecordChanges = (
  schemaField: z.ZodRecord<any, any>,
  record: Record<any, any>,
  yMap: Y.Map<any>
) => {
  const valueSchema = extractType(schemaField.valueSchema, record);
  for (const [key, value] of Object.entries(record)) {
    if (value === null) {
      yMap.set(key, null);
      continue;
    }

    if (valueSchema instanceof z.ZodObject) {
      if (typeof value !== 'object') {
        throw new Error('Value must be an object');
      }

      let nestedMap = yMap.get(key);
      if (!(nestedMap instanceof Y.Map)) {
        nestedMap = new Y.Map();
        yMap.set(key, nestedMap);
      }

      applyObjectChanges(valueSchema, value, nestedMap);
    } else if (valueSchema instanceof z.ZodRecord) {
      if (typeof value !== 'object') {
        throw new Error('Value must be an object');
      }

      let nestedMap = yMap.get(key);
      if (!(nestedMap instanceof Y.Map)) {
        nestedMap = new Y.Map();
        yMap.set(key, nestedMap);
      }

      applyRecordChanges(valueSchema, value, nestedMap);
    } else if (valueSchema instanceof z.ZodArray) {
      if (!Array.isArray(value)) {
        throw new Error('Value must be an array');
      }

      let yArray = yMap.get(key);
      if (!(yArray instanceof Y.Array)) {
        yArray = new Y.Array();
        yMap.set(key, yArray);
      }

      applyArrayChanges(valueSchema, value, yArray);
    } else if (valueSchema instanceof ZodText) {
      if (typeof value !== 'string') {
        throw new Error('Value must be a string');
      }

      let yText = yMap.get(key);
      if (!(yText instanceof Y.Text)) {
        yText = new Y.Text();
        yMap.set(key, yText);
      }

      applyTextChanges(value, yText);
    } else {
      const currentValue = yMap.get(key);
      if (!isEqual(currentValue, value)) {
        yMap.set(key, value);
      }
    }
  }

  const deletedKeys = Array.from(yMap.keys()).filter(
    (key) => !record.hasOwnProperty(key)
  );

  for (const key of deletedKeys) {
    yMap.delete(key);
  }
};

const applyTextChanges = (value: string, yText: Y.Text) => {
  const currentText = yText.toString();
  const newText = value ? value.toString() : '';

  if (!isEqual(currentText, newText)) {
    const diffs = diffChars(currentText, newText);
    let index = 0;

    for (const diff of diffs) {
      if (diff.added) {
        yText.insert(index, diff.value);
        index += diff.value.length;
      } else if (diff.removed) {
        yText.delete(index, diff.value.length);
        index -= diff.value.length;
      } else {
        index += diff.value.length;
      }
    }
  }
};

const extractType = (
  schema: z.ZodType<any, any, any>,
  value: any
): z.ZodType<any, any, any> => {
  if (schema instanceof z.ZodOptional) {
    return extractType(schema.unwrap(), value);
  }

  if (schema instanceof z.ZodNullable) {
    return extractType(schema.unwrap(), value);
  }

  if (schema instanceof z.ZodUnion) {
    for (const option of schema.options) {
      if (option.safeParse(value).success) {
        return extractType(option, value);
      }
    }
  }

  return schema;
};
