import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';

import {
  SessionQueryDto,
  SessionSortField,
  SortOrder,
} from './dto/session-query.dto';
import { Session } from './entities/session.entity';
import {
  DeviceType,
  RequestMetadata,
} from '../../common/types/request-metadata.interface';

export interface CreateSessionData {
  userId: string;
  hash: string;
  metadata?: RequestMetadata;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async create(data: CreateSessionData): Promise<Session> {
    const session = this.sessionRepository.create({
      user: { id: data.userId },
      hash: data.hash,
      browser: data.metadata?.browser || null,
      browserVersion: data.metadata?.browserVersion || null,
      os: data.metadata?.os || null,
      osVersion: data.metadata?.osVersion || null,
      deviceType: data.metadata?.deviceType || DeviceType.UNKNOWN,
      ipAddress: data.metadata?.ipAddress || null,
      userAgent: data.metadata?.userAgent || null,
    });
    return await this.sessionRepository.save(session);
  }

  async findById(id: string): Promise<Session | null> {
    return await this.sessionRepository.findOne({
      where: { id },
    });
  }

  async update(
    id: string,
    data: Partial<Pick<Session, 'hash'>>,
  ): Promise<Session> {
    const session = await this.sessionRepository.findOne({ where: { id } });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    Object.assign(session, data);
    return await this.sessionRepository.save(session);
  }

  async deleteById(id: string): Promise<void> {
    const session = await this.sessionRepository.findOne({ where: { id } });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    await this.sessionRepository.softRemove(session);
  }

  async findByUserId(userId: string): Promise<Session[]> {
    return await this.sessionRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserIdPaginated(
    userId: string,
    query: SessionQueryDto,
  ): Promise<Pagination<Session>> {
    const {
      page = 1,
      limit = 20,
      sort = SessionSortField.CREATED_AT,
      order = SortOrder.DESC,
    } = query;

    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .where('session.user_id = :userId', { userId });

    const sortField = this.getSortField(sort);
    const sortOrder = order === SortOrder.ASC ? 'ASC' : 'DESC';
    queryBuilder.orderBy(sortField, sortOrder);

    return paginate<Session>(queryBuilder, {
      page,
      limit,
      route: '/sessions',
    });
  }

  private getSortField(sort: SessionSortField): string {
    switch (sort) {
      case SessionSortField.UPDATED_AT:
        return 'session.updatedAt';
      case SessionSortField.CREATED_AT:
      default:
        return 'session.createdAt';
    }
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    const sessions = await this.findByUserId(userId);
    if (sessions.length > 0) {
      await this.sessionRepository.softRemove(sessions);
    }
  }

  async deleteAllExceptCurrent(
    userId: string,
    currentSessionId: string,
  ): Promise<number> {
    const sessions = await this.sessionRepository.find({
      where: { user: { id: userId } },
    });

    const sessionsToDelete = sessions.filter(
      (session) => session.id !== currentSessionId,
    );

    if (sessionsToDelete.length > 0) {
      await this.sessionRepository.softRemove(sessionsToDelete);
    }

    return sessionsToDelete.length;
  }
}
