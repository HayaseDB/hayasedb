import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Session } from './entities/session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async create(data: { userId: string; hash: string }): Promise<Session> {
    const session = this.sessionRepository.create({
      user: { id: data.userId },
      hash: data.hash,
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
}
