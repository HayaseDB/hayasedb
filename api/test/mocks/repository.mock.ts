import { Repository, ObjectLiteral } from 'typeorm';

export type MockRepository<T extends ObjectLiteral> = {
  [K in keyof Repository<T>]?: jest.Mock;
};

export function createMockQueryBuilder() {
  const queryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  return queryBuilder;
}

export function createMockRepository<
  T extends ObjectLiteral,
>(): MockRepository<T> {
  const queryBuilder = createMockQueryBuilder();

  return {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softRemove: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
  };
}
