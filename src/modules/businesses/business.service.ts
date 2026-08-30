import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { CreateBusinessInput, UpdateBusinessInput } from './business.schema';
import { Role } from '@prisma/client';

export class BusinessService {
  /**
   * Create a new Business
   */
  static async createBusiness(input: CreateBusinessInput, ownerUserId?: string) {
    const business = await prisma.business.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        logo: input.logo,
      },
    });

    // If initiated by a user, link user to this business as BUSINESS_OWNER
    if (ownerUserId) {
      await prisma.user.update({
        where: { id: ownerUserId },
        data: {
          businessId: business.id,
          role: Role.BUSINESS_OWNER,
        },
      });
    }

    return business;
  }

  /**
   * Get Business details by ID (Tenant isolated check)
   */
  static async getBusinessById(id: string, userBusinessId?: string | null, userRole?: Role) {
    // Tenant check: Non-super-admin users can only view their own business
    if (userRole !== Role.SUPER_ADMIN && userBusinessId !== id) {
      throw ApiError.forbidden('Access denied to business records');
    }

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            capacity: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            branches: true,
            customers: true,
            employees: true,
            services: true,
          },
        },
      },
    });

    if (!business) {
      throw ApiError.notFound('Business not found');
    }

    return business;
  }

  /**
   * List all Businesses (Super Admin access)
   */
  static async getAllBusinesses(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [total, businesses] = await Promise.all([
      prisma.business.count(),
      prisma.business.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { branches: true, customers: true, employees: true },
          },
        },
      }),
    ]);

    return {
      businesses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update Business Profile
   */
  static async updateBusiness(
    id: string,
    input: UpdateBusinessInput,
    userBusinessId?: string | null,
    userRole?: Role
  ) {
    if (userRole !== Role.SUPER_ADMIN && userBusinessId !== id) {
      throw ApiError.forbidden('Access denied to update business profile');
    }

    const existing = await prisma.business.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Business not found');
    }

    const updated = await prisma.business.update({
      where: { id },
      data: input,
    });

    return updated;
  }
}
