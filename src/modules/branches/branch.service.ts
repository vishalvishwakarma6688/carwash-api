import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { CreateBranchInput, UpdateBranchInput } from './branch.schema';
import { Role } from '@prisma/client';

export class BranchService {
  /**
   * Create a new Branch under a Business
   */
  static async createBranch(input: CreateBranchInput, userBusinessId?: string | null) {
    const targetBusinessId = input.businessId || userBusinessId;

    if (!targetBusinessId) {
      throw ApiError.badRequest('Business ID must be provided or attached to user context');
    }

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: targetBusinessId },
    });

    if (!business) {
      throw ApiError.notFound('Associated business not found');
    }

    const branch = await prisma.branch.create({
      data: {
        businessId: targetBusinessId,
        name: input.name,
        address: input.address,
        phone: input.phone,
        operatingHours: input.operatingHours,
        capacity: input.capacity || 5,
      },
    });

    return branch;
  }

  /**
   * List all Branches for a Business
   */
  static async getBranchesByBusiness(businessId: string) {
    const branches = await prisma.branch.findMany({
      where: { businessId, isActive: true },
      include: {
        _count: {
          select: {
            employees: true,
            bookings: true,
            queueItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return branches;
  }

  /**
   * Get Branch details by ID
   */
  static async getBranchById(id: string, userBusinessId?: string | null, userRole?: Role) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        business: {
          select: { id: true, name: true },
        },
        _count: {
          select: { employees: true, bookings: true },
        },
      },
    });

    if (!branch) {
      throw ApiError.notFound('Branch not found');
    }

    if (userRole !== Role.SUPER_ADMIN && userBusinessId && branch.businessId !== userBusinessId) {
      throw ApiError.forbidden('Access denied to this branch record');
    }

    return branch;
  }

  /**
   * Update Branch details
   */
  static async updateBranch(
    id: string,
    input: UpdateBranchInput,
    userBusinessId?: string | null,
    userRole?: Role
  ) {
    const existingBranch = await prisma.branch.findUnique({ where: { id } });

    if (!existingBranch) {
      throw ApiError.notFound('Branch not found');
    }

    if (userRole !== Role.SUPER_ADMIN && userBusinessId && existingBranch.businessId !== userBusinessId) {
      throw ApiError.forbidden('Access denied to modify this branch record');
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: input,
    });

    return updated;
  }
}
