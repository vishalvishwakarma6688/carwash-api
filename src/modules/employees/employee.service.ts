import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { CreateEmployeeInput, UpdateEmployeeInput } from './employee.schema';
import { QueueStatus } from '@prisma/client';

export class EmployeeService {
  static async createEmployee(input: CreateEmployeeInput, userBusinessId?: string | null) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      throw ApiError.notFound('Associated user not found');
    }

    const branch = await prisma.branch.findUnique({ where: { id: input.branchId } });
    if (!branch) {
      throw ApiError.notFound('Associated branch not found');
    }

    if (userBusinessId && branch.businessId !== userBusinessId) {
      throw ApiError.forbidden('Access denied to add employee to this branch');
    }

    const employee = await prisma.employee.create({
      data: {
        businessId: branch.businessId,
        userId: input.userId,
        branchId: input.branchId,
        employmentStatus: input.employmentStatus || 'ACTIVE',
      },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        branch: { select: { name: true } },
      },
    });

    return employee;
  }

  static async getEmployees(userBusinessId?: string | null, branchId?: string) {
    const where: any = {};

    if (userBusinessId) {
      where.branch = { businessId: userBusinessId };
    }
    if (branchId) {
      where.branchId = branchId;
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true, phone: true, role: true } },
        branch: { select: { name: true } },
        _count: {
          select: {
            assignedQueueItems: true,
          },
        },
      },
    });

    return employees;
  }

  static async getEmployeeById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
        branch: true,
        assignedQueueItems: {
          where: {
            status: { in: [QueueStatus.ASSIGNED, QueueStatus.IN_PROGRESS] },
          },
          include: {
            vehicle: true,
            booking: { include: { bookingServices: { include: { service: true } } } },
          },
        },
      },
    });

    if (!employee) {
      throw ApiError.notFound('Employee record not found');
    }

    return employee;
  }

  static async updateEmployee(id: string, input: UpdateEmployeeInput) {
    const existing = await prisma.employee.findUnique({ where: { id } });

    if (!existing) {
      throw ApiError.notFound('Employee record not found');
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: input,
      include: {
        user: { select: { fullName: true, email: true } },
        branch: { select: { name: true } },
      },
    });

    return updated;
  }
}
