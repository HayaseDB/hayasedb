import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { SessionsService } from './sessions.service';
import { Session } from './entities/session.entity';
import {
  createMockRepository,
  MockRepository,
} from '../../../test/mocks/repository.mock';
import {
  createMockSession,
  resetSessionFactory,
} from '../../../test/factories/session.factory';
import {
  createMockUser,
  resetUserFactory,
} from '../../../test/factories/user.factory';

describe('SessionsService', () => {
  let service: SessionsService;
  let repository: MockRepository<Session>;

  beforeEach(async () => {
    resetSessionFactory();
    resetUserFactory();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getRepositoryToken(Session),
          useValue: createMockRepository<Session>(),
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    repository = module.get(getRepositoryToken(Session));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a session with user reference and hash', async () => {
      const userId = 'user-123';
      const hash = 'session-hash-abc';
      const mockSession = createMockSession({ hash });

      repository.create!.mockReturnValue(mockSession);
      repository.save!.mockResolvedValue(mockSession);

      const result = await service.create({ userId, hash });

      expect(repository.create).toHaveBeenCalledWith({
        user: { id: userId },
        hash,
      });
      expect(repository.save).toHaveBeenCalledWith(mockSession);
      expect(result).toBe(mockSession);
    });
  });

  describe('findById', () => {
    it('should return session when found', async () => {
      const mockSession = createMockSession();
      repository.findOne!.mockResolvedValue(mockSession);

      const result = await service.findById(mockSession.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockSession.id },
      });
      expect(result).toBe(mockSession);
    });

    it('should return null when session not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update session hash', async () => {
      const mockSession = createMockSession({ hash: 'old-hash' });
      repository.findOne!.mockResolvedValue(mockSession);
      repository.save!.mockImplementation((session) =>
        Promise.resolve(session),
      );

      const result = await service.update(mockSession.id, { hash: 'new-hash' });

      expect(result.hash).toBe('new-hash');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when session not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { hash: 'new-hash' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteById', () => {
    it('should soft remove session', async () => {
      const mockSession = createMockSession();
      repository.findOne!.mockResolvedValue(mockSession);
      repository.softRemove!.mockResolvedValue(mockSession);

      await service.deleteById(mockSession.id);

      expect(repository.softRemove).toHaveBeenCalledWith(mockSession);
    });

    it('should throw NotFoundException when session not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.deleteById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUserId', () => {
    it('should return all sessions for user ordered by createdAt desc', async () => {
      const user = createMockUser();
      const sessions = [
        createMockSession({ user }),
        createMockSession({ user }),
      ];
      repository.find!.mockResolvedValue(sessions);

      const result = await service.findByUserId(user.id);

      expect(repository.find).toHaveBeenCalledWith({
        where: { user: { id: user.id } },
        order: { createdAt: 'DESC' },
      });
      expect(result).toBe(sessions);
    });

    it('should return empty array when user has no sessions', async () => {
      repository.find!.mockResolvedValue([]);

      const result = await service.findByUserId('user-no-sessions');

      expect(result).toEqual([]);
    });
  });
});
