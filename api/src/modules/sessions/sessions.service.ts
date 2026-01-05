import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
