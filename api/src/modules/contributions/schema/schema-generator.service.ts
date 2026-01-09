import { Injectable, Type } from '@nestjs/common';
import { getMetadataStorage } from 'class-validator';
import { DataSource } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

import { getContributableFields } from '../decorators/contributable.decorator';
import { EntityType } from '../enums/entity-type.enum';
import { getEntityClass } from '../types/entity-registry';
import { JSONSchema7, JSONSchema7TypeName } from './types/json-schema.types';

@Injectable()
export class SchemaGeneratorService {
  constructor(private readonly dataSource: DataSource) {}

  generateSchema(entityType: EntityType): JSONSchema7 {
    const entityClass = getEntityClass(entityType);
    return this.buildEntitySchema(entityClass, new Set<string>(), entityType);
  }

  private buildEntitySchema(
    entityClass: Type<unknown>,
    visited: Set<string>,
    entityType?: EntityType,
  ): JSONSchema7 {
    const className = entityClass.name;

    if (visited.has(className)) {
      return {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      };
    }

    visited.add(className);

    const contributableFields = getContributableFields(entityClass);
    const entityMetadata = this.dataSource.getMetadata(entityClass);

    const schema: JSONSchema7 = {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    };

    if (entityType) {
      schema.$schema = 'http://json-schema.org/draft-07/schema#';
      schema.$id = `hayasedb:contribution:${entityType}`;
      schema.title = `${this.capitalize(entityType)} Contribution Schema`;
      schema.description = `Schema for contributing ${entityType} data to HayaseDB`;
    }

    schema.properties!['id'] = {
      type: 'string',
      format: 'uuid',
    };

    for (const fieldName of contributableFields) {
      const columnMeta = entityMetadata.findColumnWithPropertyName(fieldName);
      const relationMeta = entityMetadata.relations.find(
        (r) => r.propertyName === fieldName,
      );

      if (columnMeta) {
        schema.properties![fieldName] = this.buildColumnSchema(
          entityClass,
          fieldName,
          columnMeta,
        );

        if (!columnMeta.isNullable && columnMeta.default === undefined) {
          (schema.required as string[]).push(fieldName);
        }
      } else if (relationMeta) {
        schema.properties![fieldName] = this.buildRelationSchema(
          relationMeta,
          new Set(visited),
        );
      }
    }

    return schema;
  }

  private buildColumnSchema(
    entityClass: Type<unknown>,
    fieldName: string,
    columnMeta: ColumnMetadata,
  ): JSONSchema7 {
    const fieldSchema: JSONSchema7 = {};

    const typeInfo = this.mapTypeOrmType(columnMeta);
    Object.assign(fieldSchema, typeInfo);

    if (columnMeta.isNullable && fieldSchema.type) {
      fieldSchema.type = [
        fieldSchema.type as JSONSchema7TypeName,
        'null' as JSONSchema7TypeName,
      ];
    }

    if (columnMeta.enum) {
      fieldSchema.enum = Object.values(columnMeta.enum);
    }

    if (columnMeta.length) {
      fieldSchema.maxLength = parseInt(String(columnMeta.length), 10);
    }

    this.applyValidatorConstraints(entityClass, fieldName, fieldSchema);

    return fieldSchema;
  }

  private buildRelationSchema(
    relationMeta: RelationMetadata,
    visited: Set<string>,
  ): JSONSchema7 {
    const targetEntity = relationMeta.inverseEntityMetadata
      .target as Type<unknown>;

    const nestedSchema = this.buildEntitySchema(targetEntity, visited);

    const isArray =
      relationMeta.relationType === 'many-to-many' ||
      relationMeta.relationType === 'one-to-many';

    if (isArray) {
      return {
        type: 'array',
        items: nestedSchema,
      };
    }

    return nestedSchema;
  }

  private applyValidatorConstraints(
    entityClass: Type<unknown>,
    fieldName: string,
    schema: JSONSchema7,
  ): void {
    const metadataStorage = getMetadataStorage();
    const validations = metadataStorage.getTargetValidationMetadatas(
      entityClass,
      '',
      false,
      false,
    );

    const fieldValidations = validations.filter(
      (v) => v.propertyName === fieldName,
    );

    for (const validation of fieldValidations) {
      const constraint = validation.constraints?.[0] as
        | number
        | RegExp
        | undefined;

      switch (validation.name) {
        case 'maxLength':
          schema.maxLength = constraint as number;
          break;
        case 'minLength':
          schema.minLength = constraint as number;
          break;
        case 'min':
          schema.minimum = constraint as number;
          break;
        case 'max':
          schema.maximum = constraint as number;
          break;
        case 'isInt':
          schema.type = 'integer';
          break;
        case 'isEmail':
          schema.format = 'email';
          break;
        case 'isUrl':
          schema.format = 'uri';
          break;
        case 'isUUID':
          schema.format = 'uuid';
          break;
        case 'arrayMaxSize':
          schema.maxItems = constraint as number;
          break;
        case 'arrayMinSize':
          schema.minItems = constraint as number;
          break;
        case 'matches':
          if (constraint instanceof RegExp) {
            schema.pattern = constraint.source;
          }
          break;
      }
    }
  }

  private mapTypeOrmType(columnMeta: ColumnMetadata): Partial<JSONSchema7> {
    const typeMap: Record<string, Partial<JSONSchema7>> = {
      varchar: { type: 'string' },
      text: { type: 'string' },
      int: { type: 'integer' },
      integer: { type: 'integer' },
      bigint: { type: 'integer' },
      float: { type: 'number' },
      double: { type: 'number' },
      decimal: { type: 'number' },
      boolean: { type: 'boolean' },
      bool: { type: 'boolean' },
      date: { type: 'string', format: 'date' },
      timestamp: { type: 'string', format: 'date-time' },
      timestamptz: { type: 'string', format: 'date-time' },
      uuid: { type: 'string', format: 'uuid' },
      json: { type: 'object' },
      jsonb: { type: 'object' },
      enum: { type: 'string' },
    };

    const dbType = String(columnMeta.type);
    return typeMap[dbType] ?? { type: 'string' };
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
