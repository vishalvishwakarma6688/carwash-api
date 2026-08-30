import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { CreateVehicleInput, UpdateVehicleInput } from './vehicle.schema';
import { Role } from '@prisma/client';

export class VehicleService {
  /**
   * Register a new Vehicle under a Customer
   */
  static async createVehicle(input: CreateVehicleInput, userBusinessId?: string | null) {
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });

    if (!customer) {
      throw ApiError.notFound('Associated customer not found');
    }

    if (userBusinessId && customer.businessId !== userBusinessId) {
      throw ApiError.forbidden('Access denied to add vehicle for this customer');
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        customerId: input.customerId,
        plateNumber: input.plateNumber.toUpperCase(),
        brand: input.brand,
        model: input.model,
        color: input.color,
        vehicleType: input.vehicleType,
        year: input.year,
        notes: input.notes,
      },
    });

    return vehicle;
  }

  /**
   * Get all Vehicles registered to a Customer
   */
  static async getVehiclesByCustomer(customerId: string) {
    const vehicles = await prisma.vehicle.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    return vehicles;
  }

  /**
   * Get Vehicle by ID
   */
  static async getVehicleById(id: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, businessId: true },
        },
      },
    });

    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }

    return vehicle;
  }

  /**
   * Update Vehicle details
   */
  static async updateVehicle(id: string, input: UpdateVehicleInput) {
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Vehicle not found');
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        ...input,
        ...(input.plateNumber && { plateNumber: input.plateNumber.toUpperCase() }),
      },
    });

    return updated;
  }

  /**
   * Delete Vehicle
   */
  static async deleteVehicle(id: string) {
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound('Vehicle not found');
    }

    await prisma.vehicle.delete({ where: { id } });
    return true;
  }
}
