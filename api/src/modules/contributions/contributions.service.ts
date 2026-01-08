import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  Type,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import {
  DataSource,
  EntityManager,
  In,
  ObjectLiteral,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata';

import { Role } from '../rbac/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { isContributableField } from './decorators/contributable.decorator';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { QueryContributionsDto } from './dto/query-contributions.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';
import { Contribution } from './entities/contribution.entity';
import { ContributionSortField } from './enums/contribution-sort-field.enum';
import { ContributionStatus } from './enums/contribution-status.enum';
import { EntityType } from './enums/entity-type.enum';
import { SortOrder } from './enums/sort-order.enum';
import {
  ENTITY_REGISTRY,
  getEntityClass,
  getEntityTypeFromClass,
} from './types/entity-registry';

interface BaseEntity extends ObjectLiteral {
  id: string;
}

@Injectable()
export class ContributionsService {
  private readonly logger = new Logger(ContributionsService.name);

  constructor(
    @InjectRepository(Contribution)
    private readonly contributionRepository: Repository<Contribution>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateContributionDto, user: User): Promise<Contribution> {
    if (!(dto.target in ENTITY_REGISTRY)) {
      throw new UnprocessableEntityException({
        code: 'UNKNOWN_TARGET',
        message: `Unknown target: ${dto.target}`,
      });
    }

    await this.validateData(dto.target, dto.data);

    const contribution = this.contributionRepository.create({
      target: dto.target,
      data: dto.data,
      note: dto.note ?? null,
      status: ContributionStatus.DRAFT,
      contributor: user,
    });

    const saved = await this.contributionRepository.save(contribution);
    this.logger.log(`Contribution created: ${saved.id}`);
    return this.resolveContribution(saved);
  }

  async findById(id: string): Promise<Contribution> {
    const contribution = await this.contributionRepository.findOne({
      where: { id },
      relations: ['contributor', 'reviewer'],
    });

    if (!contribution) {
      throw new NotFoundException({
        code: 'CONTRIBUTION_NOT_FOUND',
        message: `Contribution not found: ${id}`,
      });
    }

    return contribution;
  }

  async getById(id: string): Promise<Contribution> {
    const contribution = await this.findById(id);
    return this.resolveContribution(contribution);
  }

  async findOwn(
    userId: string,
    query: QueryContributionsDto,
  ): Promise<Pagination<Contribution>> {
    const {
      page = 1,
      limit = 20,
      status,
      target,
      sort = ContributionSortField.CREATED_AT,
      order = SortOrder.DESC,
    } = query;

    const qb = this.contributionRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.contributor', 'contributor')
      .leftJoinAndSelect('c.reviewer', 'reviewer')
      .where('contributor.id = :userId', { userId });

    if (status) qb.andWhere('c.status = :status', { status });
    if (target) qb.andWhere('c.target = :target', { target });

    const sortOrder = order === SortOrder.ASC ? 'ASC' : 'DESC';
    qb.orderBy(this.getSortField(sort), sortOrder);

    const result = await paginate<Contribution>(qb, {
      page,
      limit,
      route: '/contributions',
    });
    const resolvedItems = await Promise.all(
      result.items.map((item) => this.resolveContribution(item)),
    );
    return { ...result, items: resolvedItems };
  }

  async findQueue(
    query: QueryContributionsDto,
  ): Promise<Pagination<Contribution>> {
    const {
      page = 1,
      limit = 20,
      target,
      sort = ContributionSortField.SUBMITTED_AT,
      order = SortOrder.ASC,
    } = query;

    const qb = this.contributionRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.contributor', 'contributor')
      .leftJoinAndSelect('c.reviewer', 'reviewer')
      .where('c.status = :status', { status: ContributionStatus.PENDING });

    if (target) qb.andWhere('c.target = :target', { target });

    const sortOrder = order === SortOrder.ASC ? 'ASC' : 'DESC';
    qb.orderBy(this.getSortField(sort), sortOrder);

    const result = await paginate<Contribution>(qb, {
      page,
      limit,
      route: '/contributions/queue',
    });
    const resolvedItems = await Promise.all(
      result.items.map((item) => this.resolveContribution(item)),
    );
    return { ...result, items: resolvedItems };
  }

  async update(
    id: string,
    dto: UpdateContributionDto,
    user: User,
  ): Promise<Contribution> {
    const contribution = await this.findById(id);

    this.ensureOwnership(contribution, user);
    this.ensureDraftStatus(contribution);

    await this.validateData(contribution.target, dto.data);

    contribution.data = dto.data;
    if (dto.note !== undefined) contribution.note = dto.note ?? null;

    const saved = await this.contributionRepository.save(contribution);
    this.logger.log(`Contribution updated: ${id}`);
    return this.resolveContribution(saved);
  }

  async delete(id: string, user: User): Promise<void> {
    const contribution = await this.findById(id);

    this.ensureOwnership(contribution, user);

    if (
      contribution.status !== ContributionStatus.DRAFT &&
      contribution.status !== ContributionStatus.PENDING
    ) {
      throw new UnprocessableEntityException({
        code: 'CANNOT_DELETE',
        message: 'Only draft or pending contributions can be deleted',
      });
    }

    await this.contributionRepository.remove(contribution);
    this.logger.log(`Contribution deleted: ${id}`);
  }

  async submit(id: string, user: User): Promise<Contribution> {
    const contribution = await this.findById(id);

    this.ensureOwnership(contribution, user);
    this.ensureDraftStatus(contribution);

    const dataId = contribution.data['id'] as string | undefined;
    if (dataId) {
      const exists = await this.entityExists(contribution.target, dataId);
      if (!exists) {
        throw new UnprocessableEntityException({
          code: 'TARGET_NOT_FOUND',
          message: `Target not found: ${dataId}`,
        });
      }
    }

    contribution.status = ContributionStatus.PENDING;
    contribution.submittedAt = new Date();

    const saved = await this.contributionRepository.save(contribution);
    this.logger.log(`Contribution submitted: ${id}`);
    return this.resolveContribution(saved);
  }

  async approve(id: string, reviewer: User): Promise<Contribution> {
    const contribution = await this.findById(id);

    this.ensurePendingStatus(contribution);
    this.ensureNotSelfReview(contribution, reviewer);

    const result = await this.dataSource.transaction(async (manager) => {
      await this.applyData(contribution.target, contribution.data, manager);

      contribution.status = ContributionStatus.APPROVED;
      contribution.reviewer = reviewer;
      contribution.reviewedAt = new Date();

      const saved = await manager.save(contribution);
      this.logger.log(`Contribution approved: ${id}`);
      return saved;
    });
    return this.resolveContribution(result);
  }

  async reject(
    id: string,
    reviewer: User,
    note: string,
  ): Promise<Contribution> {
    const contribution = await this.findById(id);

    this.ensurePendingStatus(contribution);
    this.ensureNotSelfReview(contribution, reviewer);

    if (!note?.trim()) {
      throw new UnprocessableEntityException({
        code: 'NOTE_REQUIRED',
        message: 'A note is required when rejecting',
      });
    }

    contribution.status = ContributionStatus.REJECTED;
    contribution.reviewer = reviewer;
    contribution.note = note;
    contribution.reviewedAt = new Date();

    const saved = await this.contributionRepository.save(contribution);
    this.logger.log(`Contribution rejected: ${id}`);
    return this.resolveContribution(saved);
  }

  private async applyData(
    target: EntityType,
    data: Record<string, unknown>,
    manager: EntityManager,
  ): Promise<BaseEntity> {
    const entityId = data['id'] as string | undefined;
    return entityId
      ? this.updateEntity(target, entityId, data, manager)
      : this.createEntity(target, data, manager);
  }

  private async createEntity(
    entityType: EntityType,
    data: Record<string, unknown>,
    manager: EntityManager,
  ): Promise<BaseEntity> {
    const entityClass = getEntityClass(entityType);
    const repo = manager.getRepository(entityClass);
    const relations = this.getContributableRelations(entityType);

    const fields: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (key === 'id') continue;
      if (!isContributableField(entityClass, key)) continue;
      if (relations.some((r) => r.propertyName === key)) continue;
      fields[key] = value;
    }

    const entity = repo.create(fields as BaseEntity);

    for (const rel of relations) {
      const value = data[rel.propertyName];
      if (value === undefined || value === null) continue;
      (entity as Record<string, unknown>)[rel.propertyName] =
        await this.resolveRelation(rel, value, manager);
    }

    const saved = (await repo.save(entity)) as BaseEntity;
    this.logger.log(`Created ${entityType}: ${saved.id}`);
    return saved;
  }

  private async updateEntity(
    entityType: EntityType,
    entityId: string,
    data: Record<string, unknown>,
    manager: EntityManager,
  ): Promise<BaseEntity> {
    const entityClass = getEntityClass(entityType);
    const repo = manager.getRepository(entityClass);
    const relations = this.getContributableRelations(entityType);
    const entity = await this.findEntity(entityType, entityId, manager);

    for (const [key, value] of Object.entries(data)) {
      if (key === 'id') continue;
      if (!isContributableField(entityClass, key)) continue;
      if (relations.some((r) => r.propertyName === key)) continue;
      (entity as Record<string, unknown>)[key] = value;
    }

    for (const rel of relations) {
      const value = data[rel.propertyName];
      if (value === undefined) continue;

      const oldItems = (entity as Record<string, unknown>)[rel.propertyName];

      if (value === null || (Array.isArray(value) && value.length === 0)) {
        if (rel.relationType === 'one-to-many' && Array.isArray(oldItems)) {
          await this.deleteOrphans(rel, oldItems as BaseEntity[], [], manager);
        }
        (entity as Record<string, unknown>)[rel.propertyName] =
          rel.relationType === 'many-to-one' ||
          rel.relationType === 'one-to-one'
            ? null
            : [];
        continue;
      }

      const newItems = await this.resolveRelation(rel, value, manager);

      if (rel.relationType === 'one-to-many' && Array.isArray(oldItems)) {
        await this.deleteOrphans(
          rel,
          oldItems as BaseEntity[],
          newItems as BaseEntity[],
          manager,
        );
      }

      (entity as Record<string, unknown>)[rel.propertyName] = newItems;
    }

    const saved = await repo.save(entity);
    this.logger.log(`Updated ${entityType}: ${entityId}`);
    return saved;
  }

  private async deleteOrphans(
    relation: RelationMetadata,
    oldItems: BaseEntity[],
    newItems: BaseEntity[],
    manager: EntityManager,
  ): Promise<void> {
    const newIds = new Set(newItems.map((item) => item.id));
    const orphanIds = oldItems
      .filter((item) => !newIds.has(item.id))
      .map((item) => item.id);

    if (orphanIds.length === 0) return;

    const targetClass = this.getRelationTargetClass(relation);
    if (!targetClass) return;

    const targetType = getEntityTypeFromClass(targetClass);
    if (!targetType) return;

    const repo = manager.getRepository(targetClass);
    const metadata = manager.connection.getMetadata(targetClass);

    if (metadata.deleteDateColumn) {
      await repo.softDelete({ id: In(orphanIds) });
      this.logger.log(
        `Soft deleted ${orphanIds.length} orphaned ${targetType}(s)`,
      );
    } else {
      await repo.delete({ id: In(orphanIds) });
      this.logger.log(`Deleted ${orphanIds.length} orphaned ${targetType}(s)`);
    }
  }

  private async resolveRelation(
    relation: RelationMetadata,
    value: unknown,
    manager: EntityManager,
  ): Promise<BaseEntity | BaseEntity[] | null> {
    const targetClass = this.getRelationTargetClass(relation);
    if (!targetClass) return null;

    const targetType = getEntityTypeFromClass(targetClass);
    if (!targetType) return null;

    const items = Array.isArray(value) ? value : [value];

    const idsToFetch: string[] = [];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const itemData = item as Record<string, unknown>;
      const itemId = itemData['id'] as string | undefined;
      if (itemId && Object.keys(itemData).length === 1) {
        idsToFetch.push(itemId);
      }
    }

    const refMap = new Map<string, BaseEntity>();
    if (idsToFetch.length > 0) {
      const repo = manager.getRepository(targetClass);
      const entities = await repo.find({ where: { id: In(idsToFetch) } });
      for (const e of entities as BaseEntity[]) {
        refMap.set(e.id, e);
      }
      const missing = idsToFetch.filter((id) => !refMap.has(id));
      if (missing.length > 0) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: `${targetType} not found: ${missing.join(', ')}`,
        });
      }
    }

    const resolved: BaseEntity[] = [];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const itemData = item as Record<string, unknown>;
      const itemId = itemData['id'] as string | undefined;

      if (itemId && Object.keys(itemData).length === 1) {
        resolved.push(refMap.get(itemId)!);
      } else if (itemId) {
        const entity = await this.updateEntity(
          targetType,
          itemId,
          itemData,
          manager,
        );
        resolved.push(entity);
      } else {
        const entity = await this.createEntity(targetType, itemData, manager);
        resolved.push(entity);
      }
    }

    if (
      relation.relationType === 'many-to-one' ||
      relation.relationType === 'one-to-one'
    ) {
      return resolved[0] ?? null;
    }

    return resolved;
  }

  private ensureOwnership(contribution: Contribution, user: User): void {
    if (contribution.contributor.id !== user.id) {
      throw new ForbiddenException({
        code: 'NOT_OWNER',
        message: 'Not your contribution',
      });
    }
  }

  private ensureDraftStatus(contribution: Contribution): void {
    if (contribution.status !== ContributionStatus.DRAFT) {
      throw new UnprocessableEntityException({
        code: 'NOT_DRAFT',
        message: 'Only drafts can be modified',
      });
    }
  }

  private ensurePendingStatus(contribution: Contribution): void {
    if (contribution.status !== ContributionStatus.PENDING) {
      throw new UnprocessableEntityException({
        code: 'NOT_PENDING',
        message: 'Only pending can be reviewed',
      });
    }
  }

  private ensureNotSelfReview(
    contribution: Contribution,
    reviewer: User,
  ): void {
    if (
      contribution.contributor.id === reviewer.id &&
      reviewer.role !== Role.ADMINISTRATOR
    ) {
      throw new ForbiddenException({
        code: 'SELF_REVIEW',
        message: 'Cannot review own contribution',
      });
    }
  }

  private async entityExists(type: EntityType, id: string): Promise<boolean> {
    const entityClass = getEntityClass(type);
    const result = await this.dataSource
      .getRepository(entityClass)
      .createQueryBuilder('e')
      .where('e.id = :id', { id })
      .select('1')
      .limit(1)
      .getRawOne<{ '1': number } | undefined>();
    return result !== undefined;
  }

  private async findEntity(
    type: EntityType,
    id: string,
    manager: EntityManager,
  ): Promise<BaseEntity> {
    const entityClass = getEntityClass(type);
    const relations = this.getContributableRelations(type).map(
      (r) => r.propertyName,
    );
    const entity = await manager.getRepository(entityClass).findOne({
      where: { id },
      relations,
    });

    if (!entity) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `${type} not found: ${id}`,
      });
    }

    return entity as BaseEntity;
  }

  private getContributableRelations(type: EntityType): RelationMetadata[] {
    const entityClass = getEntityClass(type);
    const metadata = this.dataSource.getMetadata(entityClass);

    return metadata.relations.filter((r) => {
      const target = this.getRelationTargetClass(r);
      return (
        target &&
        getEntityTypeFromClass(target) &&
        isContributableField(entityClass, r.propertyName)
      );
    });
  }

  private getRelationTargetClass(rel: RelationMetadata): Type<unknown> | null {
    return (rel.inverseEntityMetadata?.target as Type<unknown>) ?? null;
  }

  private async resolveDataForResponse(
    target: EntityType,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const relations = this.getContributableRelations(target);
    const resolved = { ...data };

    for (const rel of relations) {
      const value = data[rel.propertyName];
      if (value === undefined || value === null) continue;

      const targetClass = this.getRelationTargetClass(rel);
      if (!targetClass) continue;

      const items = Array.isArray(value) ? value : [value];
      const resolvedItems: Record<string, unknown>[] = [];

      const idsToFetch = items
        .filter(
          (item): item is Record<string, unknown> =>
            item !== null && typeof item === 'object' && 'id' in item,
        )
        .map((item) => item.id as string);

      const entityMap = new Map<string, Record<string, unknown>>();
      if (idsToFetch.length > 0) {
        const repo = this.dataSource.getRepository(targetClass);
        const entities = await repo.find({ where: { id: In(idsToFetch) } });
        for (const e of entities as BaseEntity[]) {
          entityMap.set(e.id, e as Record<string, unknown>);
        }
      }

      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const itemData = item as Record<string, unknown>;
        const itemId = itemData['id'] as string | undefined;

        if (itemId && entityMap.has(itemId)) {
          resolvedItems.push({
            ...entityMap.get(itemId)!,
            ...itemData,
          });
        } else {
          resolvedItems.push(itemData);
        }
      }

      resolved[rel.propertyName] = Array.isArray(value)
        ? resolvedItems
        : (resolvedItems[0] ?? null);
    }

    return resolved;
  }

  private async resolveContribution(
    contribution: Contribution,
  ): Promise<Contribution> {
    const resolvedData = await this.resolveDataForResponse(
      contribution.target,
      contribution.data,
    );
    return {
      ...contribution,
      data: resolvedData,
    } as Contribution;
  }

  private async validateData(
    target: EntityType,
    data: Record<string, unknown>,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.applyData(target, data, queryRunner.manager);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    } finally {
      try {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }
    }
  }

  private getSortField(sort: ContributionSortField): string {
    switch (sort) {
      case ContributionSortField.CREATED_AT:
        return 'c.createdAt';
      case ContributionSortField.SUBMITTED_AT:
        return 'c.submittedAt';
      case ContributionSortField.REVIEWED_AT:
        return 'c.reviewedAt';
      default:
        return 'c.createdAt';
    }
  }
}
