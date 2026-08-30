import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { CreateCustomerInput, UpdateCustomerInput } from './customer.schema';
import { Role } from '@prisma/client';

export class CustomerService {
  /**
   * Create a new Customer record under a tenant business
   */
  static async createCustomer(input: CreateCustomerInput, userBusinessId?: string | null) {
    const targetBusinessId = input.businessId || userBusinessId;

    if (!targetBusinessId) {
      throw ApiError.badRequest('Business ID must be provided or attached to user context');
    }

    const customer = await prisma.customer.create({
      data: {
        businessId: targetBusinessId,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        address: input.address,
        notes: input.notes,
      },
    });

    // Create default loyalty account for customer
    await prisma.loyaltyAccount.create({
      data: {
        customerId: customer.id,
        pointsBalance: 0,
      },
    });

    return customer;
  }

  /**
   * List and search Customers (Tenant isolated)
   */
  static async getCustomers(
    businessId: string,
    search?: string,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      businessId,
    };

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where: whereCondition }),
      prisma.customer.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicles: true,
          loyaltyAccount: {
            select: { pointsBalance: true, tier: true },
          },
          _count: {
            select: { bookings: true, vehicles: true },
          },
        },
      }),
    ]);

    return {
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Customer details by ID
   */
  static async getCustomerById(id: string, userBusinessId?: string | null, userRole?: Role) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: true,
        loyaltyAccount: true,
        bookings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            vehicle: true,
            branch: { select: { name: true } },
          },
        },
      },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    if (userRole !== Role.SUPER_ADMIN && userBusinessId && customer.businessId !== userBusinessId) {
      throw ApiError.forbidden('Access denied to this customer record');
    }

    return customer;
  }

  /**
   * Update Customer details
   */
  static async updateCustomer(
    id: string,
    input: UpdateCustomerInput,
    userBusinessId?: string | null,
    userRole?: Role
  ) {
    const existing = await prisma.customer.findUnique({ where: { id } });

    if (!existing) {
      throw ApiError.notFound('Customer not found');
    }

    if (userRole !== Role.SUPER_ADMIN && userBusinessId && existing.businessId !== userBusinessId) {
      throw ApiError.forbidden('Access denied to modify this customer record');
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: input,
    });

    return updated;
  }
}
