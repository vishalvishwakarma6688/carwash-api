import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { CreateBookingInput, UpdateBookingStatusInput } from './booking.schema';
import { BookingStatus, QueueStatus } from '@prisma/client';

export class BookingService {
  /**
   * Create a new Booking with slot validation & total price calculation
   */
  static async createBooking(input: CreateBookingInput, userBusinessId?: string | null) {
    // 1. Verify branch exists & check capacity
    const branch = await prisma.branch.findUnique({
      where: { id: input.branchId },
      include: { business: true },
    });

    if (!branch || !branch.isActive) {
      throw ApiError.notFound('Branch not found or inactive');
    }

    const businessId = branch.businessId;

    if (userBusinessId && businessId !== userBusinessId) {
      throw ApiError.forbidden('Access denied to create booking for this business branch');
    }

    // 2. Validate customer & vehicle
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw ApiError.notFound('Customer not found');

    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle || vehicle.customerId !== customer.id) {
      throw ApiError.badRequest('Vehicle not found or does not belong to customer');
    }

    // 3. Prevent Overbooking: Count existing active bookings for slot
    const bookingDateObj = new Date(input.bookingDate);
    const startOfDay = new Date(bookingDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookingsCount = await prisma.booking.count({
      where: {
        branchId: input.branchId,
        timeSlot: input.timeSlot,
        bookingDate: { gte: startOfDay, lte: endOfDay },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.IN_PROGRESS] },
      },
    });

    if (existingBookingsCount >= branch.capacity) {
      throw ApiError.conflict(`Time slot '${input.timeSlot}' has reached maximum branch capacity (${branch.capacity})`);
    }

    // 4. Calculate Total Price & Fetch Selected Services / Package
    let totalAmount = 0;
    const servicesToAttach: { serviceId?: string; packageId?: string; price: number }[] = [];

    if (input.packageId) {
      const pkg = await prisma.servicePackage.findUnique({ where: { id: input.packageId } });
      if (!pkg || !pkg.isActive) throw ApiError.notFound('Service package not found or inactive');
      totalAmount += pkg.price;
      servicesToAttach.push({ packageId: pkg.id, price: pkg.price });
    }

    if (input.serviceIds && input.serviceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: { id: { in: input.serviceIds }, isActive: true },
      });

      if (services.length !== input.serviceIds.length) {
        throw ApiError.badRequest('One or more selected services are invalid or inactive');
      }

      for (const service of services) {
        totalAmount += service.price;
        servicesToAttach.push({ serviceId: service.id, price: service.price });
      }
    }

    if (servicesToAttach.length === 0) {
      throw ApiError.badRequest('At least one service or service package must be selected');
    }

    // 5. Create Booking Record
    const booking = await prisma.booking.create({
      data: {
        businessId,
        branchId: input.branchId,
        customerId: input.customerId,
        vehicleId: input.vehicleId,
        bookingDate: bookingDateObj,
        timeSlot: input.timeSlot,
        totalAmount,
        status: BookingStatus.CONFIRMED,
        notes: input.notes,
        bookingServices: {
          create: servicesToAttach,
        },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, plateNumber: true, brand: true, model: true } },
        branch: { select: { id: true, name: true } },
        bookingServices: { include: { service: true, package: true } },
      },
    });

    return booking;
  }

  /**
   * Get Bookings List (Branch / Customer filter)
   */
  static async getBookings(
    query: { branchId?: string; customerId?: string; status?: BookingStatus; date?: string },
    page = 1,
    limit = 10,
    userBusinessId?: string | null
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userBusinessId) {
      where.businessId = userBusinessId;
    }
    if (query.branchId) where.branchId = query.branchId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.status) where.status = query.status;

    if (query.date) {
      const targetDate = new Date(query.date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.bookingDate = { gte: startOfDay, lte: endOfDay };
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { bookingDate: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          vehicle: { select: { id: true, plateNumber: true, brand: true, model: true } },
          branch: { select: { id: true, name: true } },
          bookingServices: { include: { service: true, package: true } },
        },
      }),
    ]);

    return {
      bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Booking by ID
   */
  static async getBookingById(id: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        branch: true,
        bookingServices: { include: { service: true, package: true } },
        payments: true,
        queueItem: true,
      },
    });

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    return booking;
  }

  /**
   * Update Booking Status & Trigger Operational Queue Entry when Checked-In
   */
  static async updateBookingStatus(
    id: string,
    input: UpdateBookingStatusInput,
    updatedById?: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { queueItem: true },
    });

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        ...(input.status && { status: input.status }),
        ...(input.paymentStatus && { paymentStatus: input.paymentStatus }),
        ...(input.notes && { notes: input.notes }),
      },
      include: {
        customer: true,
        vehicle: true,
        branch: true,
      },
    });

    // If status changes to CHECKED_IN and not yet in queue, automatically push to operational QueueItem!
    if (input.status === BookingStatus.CHECKED_IN && !booking.queueItem) {
      const lastQueueItem = await prisma.queueItem.findFirst({
        where: { branchId: booking.branchId },
        orderBy: { queueNumber: 'desc' },
      });

      const nextQueueNumber = (lastQueueItem?.queueNumber || 0) + 1;

      const queueItem = await prisma.queueItem.create({
        data: {
          branchId: booking.branchId,
          bookingId: booking.id,
          vehicleId: booking.vehicleId,
          queueNumber: nextQueueNumber,
          status: QueueStatus.WAITING,
          arrivalTime: new Date(),
        },
      });

      // Audit status transition
      await prisma.workflowAudit.create({
        data: {
          queueItemId: queueItem.id,
          previousStatus: 'BOOKED',
          newStatus: 'CHECKED_IN_WAITING',
          updatedById,
          notes: 'Automatic queue entry on vehicle check-in',
        },
      });
    }

    return updatedBooking;
  }
}
