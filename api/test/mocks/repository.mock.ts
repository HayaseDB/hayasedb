import { Repository, ObjectLiteral } from 'typeorm';

export type MockRepository<T extends ObjectLiteral> = {
  [K in keyof Repository<T>]?: jest.Mock;
};

export function createMockRepository<
  T extends ObjectLiteral,
>(): MockRepository<T> {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softRemove: jest.fn(),
    remove: jest.fn(),
  };
}
