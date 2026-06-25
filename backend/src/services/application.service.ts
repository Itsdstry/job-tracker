import { ApplicationStatus, Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';

export interface CreateApplicationDto {
  company: string;
  position: string;
  salary?: number;
  location?: string;
  notes?: string;
  applicationDate?: string;
  status?: ApplicationStatus;
}

export interface ListApplicationsQuery {
  status?: ApplicationStatus;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const createApplication = async (userId: string, dto: CreateApplicationDto) => {
  return prisma.application.create({
    data: {
      ...dto,
      applicationDate: dto.applicationDate ? new Date(dto.applicationDate) : new Date(),
      userId,
    },
  });
};

export const listApplications = async (userId: string, query: ListApplicationsQuery) => {
  const {
    status,
    search,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 20,
  } = query;

  const where: Prisma.ApplicationWhereInput = {
    userId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { company: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const validSortFields = ['applicationDate', 'company', 'position', 'createdAt', 'salary'];
  const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: { [orderByField]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.application.count({ where }),
  ]);

  return {
    applications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getApplicationById = async (userId: string, id: string) => {
  const app = await prisma.application.findFirst({ where: { id, userId } });
  if (!app) throw { statusCode: 404, message: 'Application not found' };
  return app;
};

export const updateApplication = async (
  userId: string,
  id: string,
  dto: Partial<CreateApplicationDto>
) => {
  const existing = await prisma.application.findFirst({ where: { id, userId } });
  if (!existing) throw { statusCode: 404, message: 'Application not found' };

  return prisma.application.update({
    where: { id },
    data: {
      ...dto,
      ...(dto.applicationDate && { applicationDate: new Date(dto.applicationDate) }),
    },
  });
};

export const deleteApplication = async (userId: string, id: string) => {
  const existing = await prisma.application.findFirst({ where: { id, userId } });
  if (!existing) throw { statusCode: 404, message: 'Application not found' };
  await prisma.application.delete({ where: { id } });
};
