import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { CreateWalkInInput, UpdateQueueStatusInput } from './queue.schema';
import { BookingStatus, QueueStatus } from '@prisma/client';

export class QueueService {
  /**
   * Register a Walk-In Customer directly into the Operational Queue
   */
  static async createWalkIn(input: CreateWalkInInput, userBusinessId?: string | null) {
    const branch = await prisma.branch.findUnique({
      where: { id: input.branchId },
      include: { business: true },
    });

    if (!branch || !branch.isActive) {
      throw ApiError.notFound('Branch not found or inactive');
    }

    const businessId = branch.businessId;

    if (userBusinessId && businessId !== userBusinessId) {
      throw ApiError.forbidden('Access denied to branch');
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { businessId, phone: input.customerPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          businessId,
          name: input.customerName,
          phone: input.customerPhone,
        },
      });

      await prisma.loyaltyAccount.create({
        data: { customerId: customer.id, pointsBalance: 0 },
      });
    }

    // Find or create vehicle
    const plate = input.plateNumber.toUpperCase();
    let vehicle = await prisma.vehicle.findFirst({
      where: { customerId: customer.id, plateNumber: plate },
    });

    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          customerId: customer.id,
          plateNumber: plate,
          brand: input.brand,
          model: input.model,
          vehicleType: input.vehicleType,
        },
      });
    }

    // Calculate total price for walk-in services
    let totalAmount = 0;
    const servicesToAttach: { serviceId?: string; packageId?: string; price: number }[] = [];

    if (input.packageId) {
      const pkg = await prisma.servicePackage.findUnique({ where: { id: input.packageId } });
      if (pkg) {
        totalAmount += pkg.price;
        servicesToAttach.push({ packageId: pkg.id, price: pkg.price });
      }
    }

    if (input.serviceIds && input.serviceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: { id: { in: input.serviceIds } },
      });
      for (const s of services) {
        totalAmount += s.price;
        servicesToAttach.push({ serviceId: s.id, price: s.price });
      }
    }

    // Create checked-in booking record for walk-in
    const now = new Date();
    const timeSlotStr = `${now.getHours()}:${now.getMinutes()} (Walk-in)`;

    const booking = await prisma.booking.create({
      data: {
        businessId,
        branchId: input.branchId,
        customerId: customer.id,
        vehicleId: vehicle.id,
        bookingDate: now,
        timeSlot: timeSlotStr,
        status: BookingStatus.CHECKED_IN,
        totalAmount,
        notes: input.notes,
        bookingServices: { create: servicesToAttach },
      },
    });

    // Determine next queue number
    const lastQueueItem = await prisma.queueItem.findFirst({
      where: { branchId: input.branchId },
      orderBy: { queueNumber: 'desc' },
    });
    const queueNumber = (lastQueueItem?.queueNumber || 0) + 1;

    // Create QueueItem
    const queueItem = await prisma.queueItem.create({
      data: {
        branchId: input.branchId,
        bookingId: booking.id,
        vehicleId: vehicle.id,
        queueNumber,
        priority: input.priority || 0,
        status: QueueStatus.WAITING,
        arrivalTime: now,
      },
      include: {
        vehicle: true,
        booking: {
          include: {
            customer: true,
            bookingServices: { include: { service: true, package: true } },
          },
        },
      },
    });

    // Workflow audit log
    await prisma.workflowAudit.create({
      data: {
        queueItemId: queueItem.id,
        previousStatus: 'WALK_IN',
        newStatus: 'WAITING',
        notes: 'Walk-in customer queued',
      },
    });

    return queueItem;
  }

  /**
   * Get Active Queue for a Branch
   */
  static async getBranchQueue(branchId: string) {
    const queueItems = await prisma.queueItem.findMany({
      where: {
        branchId,
        status: { in: [QueueStatus.WAITING, QueueStatus.ASSIGNED, QueueStatus.IN_PROGRESS] },
      },
      orderBy: [{ priority: 'desc' }, { arrivalTime: 'asc' }],
      include: {
        vehicle: true,
        assignedEmployee: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        booking: {
          include: {
            customer: { select: { name: true, phone: true } },
            bookingServices: { include: { service: true, package: true } },
          },
        },
      },
    });

    return queueItems;
  }

  /**
   * Update Queue Item Status & Record Workflow Audit Trail
   */
  static async updateQueueStatus(
    id: string,
    input: UpdateQueueStatusInput,
    updatedById?: string
  ) {
    const existing = await prisma.queueItem.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!existing) {
      throw ApiError.notFound('Queue item not found');
    }

    const previousStatus = existing.status;

    // If assigning employee, verify employee exists
    if (input.assignedEmployeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: input.assignedEmployeeId },
      });
      if (!employee) throw ApiError.notFound('Assigned employee not found');
    }

    const updated = await prisma.queueItem.update({
      where: { id },
      data: {
        ...(input.status && { status: input.status }),
        ...(input.assignedEmployeeId && { assignedEmployeeId: input.assignedEmployeeId }),
        ...(input.priority !== undefined && { priority: input.priority }),
      },
      include: {
        vehicle: true,
        assignedEmployee: {
          include: { user: { select: { fullName: true } } },
        },
        booking: true,
      },
    });

    // Update associated booking status if status progressed
    if (existing.bookingId && input.status) {
      let bookingStatus: BookingStatus | undefined = undefined;
      if (input.status === QueueStatus.IN_PROGRESS) bookingStatus = BookingStatus.IN_PROGRESS;
      if (input.status === QueueStatus.COMPLETED) bookingStatus = BookingStatus.COMPLETED;
      if (input.status === QueueStatus.CANCELLED) bookingStatus = BookingStatus.CANCELLED;

      if (bookingStatus) {
        await prisma.booking.update({
          where: { id: existing.bookingId },
          data: { status: bookingStatus },
        });
      }
    }

    // Workflow Audit log
    await prisma.workflowAudit.create({
      data: {
        queueItemId: id,
        previousStatus,
        newStatus: input.status || previousStatus,
        updatedById,
        notes: input.notes || `Queue status updated to ${input.status}`,
      },
    });

    return updated;
  }
}
