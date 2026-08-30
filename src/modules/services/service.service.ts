import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import {
  CreateServiceInput,
  UpdateServiceInput,
  CreatePackageInput,
  UpdatePackageInput,
} from './service.schema';
import { Role } from '@prisma/client';

export class ServiceCatalogService {
  /**
   * Create a new Car Wash Service
   */
  static async createService(input: CreateServiceInput, userBusinessId?: string | null) {
    const businessId = input.businessId || userBusinessId;
    if (!businessId) {
      throw ApiError.badRequest('Business ID must be provided or present in session context');
    }

    const service = await prisma.service.create({
      data: {
        businessId,
        name: input.name,
        description: input.description,
        price: input.price,
        estimatedDurationMinutes: input.estimatedDurationMinutes || 30,
        supportedVehicleTypes: input.supportedVehicleTypes,
      },
    });

    return service;
  }

  /**
   * List Services for a Business
   */
  static async getServicesByBusiness(businessId: string, includeInactive = false) {
    const services = await prisma.service.findMany({
      where: {
        businessId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });

    return services;
  }

  /**
   * Get Service by ID
   */
  static async getServiceById(id: string) {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw ApiError.notFound('Service not found');
    }
    return service;
  }

  /**
   * Update Service
   */
  static async updateService(
    id: string,
    input: UpdateServiceInput,
    userBusinessId?: string | null,
    userRole?: Role
  ) {
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Service not found');
    }

    if (userRole !== Role.SUPER_ADMIN && userBusinessId && existing.businessId !== userBusinessId) {
      throw ApiError.forbidden('Access denied to update service');
    }

    const updated = await prisma.service.update({
      where: { id },
      data: input,
    });

    return updated;
  }

  /**
   * Create Service Package
   */
  static async createPackage(input: CreatePackageInput, userBusinessId?: string | null) {
    const businessId = input.businessId || userBusinessId;
    if (!businessId) {
      throw ApiError.badRequest('Business ID must be provided');
    }

    const pkg = await prisma.servicePackage.create({
      data: {
        businessId,
        name: input.name,
        description: input.description,
        price: input.price,
        estimatedDurationMinutes: input.estimatedDurationMinutes || 60,
        packageServices: {
          create: input.serviceIds.map((serviceId) => ({
            serviceId,
          })),
        },
      },
      include: {
        packageServices: {
          include: { service: true },
        },
      },
    });

    return pkg;
  }

  /**
   * List Service Packages for a Business
   */
  static async getPackagesByBusiness(businessId: string, includeInactive = false) {
    const packages = await prisma.servicePackage.findMany({
      where: {
        businessId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        packageServices: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return packages;
  }

  /**
   * Get Package by ID
   */
  static async getPackageById(id: string) {
    const pkg = await prisma.servicePackage.findUnique({
      where: { id },
      include: {
        packageServices: {
          include: { service: true },
        },
      },
    });

    if (!pkg) {
      throw ApiError.notFound('Service package not found');
    }

    return pkg;
  }

  /**
   * Update Service Package
   */
  static async updatePackage(
    id: string,
    input: UpdatePackageInput,
    userBusinessId?: string | null,
    userRole?: Role
  ) {
    const existing = await prisma.servicePackage.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Service package not found');
    }

    if (userRole !== Role.SUPER_ADMIN && userBusinessId && existing.businessId !== userBusinessId) {
      throw ApiError.forbidden('Access denied to modify this package');
    }

    const { serviceIds, ...updateData } = input;

    const updated = await prisma.$transaction(async (tx) => {
      if (serviceIds) {
        // Clear existing package services and replace
        await tx.packageService.deleteMany({ where: { packageId: id } });
        await tx.packageService.createMany({
          data: serviceIds.map((serviceId) => ({
            packageId: id,
            serviceId,
          })),
        });
      }

      return tx.servicePackage.update({
        where: { id },
        data: updateData,
        include: {
          packageServices: { include: { service: true } },
        },
      });
    });

    return updated;
  }
}
