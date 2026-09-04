import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { CreateBookingInput, UpdateBookingStatusInput } from './booking.schema';
import { BookingStatus, QueueStatus, ServiceLocationType } from '@prisma/client';

export class BookingService {
  /**
   * Create a new Booking with robust branch, customer & vehicle resolution
   */
  static async createBooking(input: CreateBookingInput, userBusinessId?: string | null) {
    // 1. Resolve branch or business
    let branch = await prisma.branch.findFirst({
      where: { OR: [{ id: input.branchId }, { businessId: input.branchId }] },
      include: { business: true },
    });

    if (!branch) {
      // Fallback: Pick any active branch in database
      branch = await prisma.branch.findFirst({
        include: { business: true },
      });
    }

    if (!branch || !branch.isActive) {
      throw ApiError.notFound('No active car wash branch found for appointment');
    }

    const businessId = branch.businessId;

    // 2. Validate doorstep home wash location requirements
    const isDoorstep = input.locationType === ServiceLocationType.DOORSTEP_HOME;
    if (isDoorstep && (!input.address || input.address.trim().length === 0)) {
      throw ApiError.badRequest('Home address is required for Doorstep Home Car Wash appointments');
    }

    // 3. Resolve Customer Record
    let customer = await prisma.customer.findFirst({
      where: { OR: [{ id: input.customerId }, { userId: input.customerId }] },
    });

    if (!customer) {
      // Auto-create Customer record for user if missing
      const userObj = await prisma.user.findUnique({ where: { id: input.customerId } });
      customer = await prisma.customer.create({
        data: {
          businessId,
          userId: userObj?.id || null,
          name: userObj?.fullName || 'Customer',
          email: userObj?.email || 'customer@example.com',
          phone: userObj?.phone || '',
        },
      });
    }

    // 4. Resolve Vehicle Record
    let vehicle = input.vehicleId
      ? await prisma.vehicle.findFirst({
          where: { OR: [{ id: input.vehicleId }, { customerId: customer.id }] },
        })
      : await prisma.vehicle.findFirst({ where: { customerId: customer.id } });

    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          customerId: customer.id,
          brand: 'Standard Car',
          model: 'Sedan',
          plateNumber: 'CAR-' + Math.floor(1000 + Math.random() * 9000),
          vehicleType: 'SEDAN',
        },
      });
    }

    // 5. Check capacity / active slot bookings
    const bookingDateObj = new Date(input.bookingDate);
    const startOfDay = new Date(bookingDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookingsCount = await prisma.booking.count({
      where: {
        branchId: branch.id,
        timeSlot: input.timeSlot,
        bookingDate: { gte: startOfDay, lte: endOfDay },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.IN_PROGRESS] },
      },
    });

    if (existingBookingsCount >= branch.capacity) {
      throw ApiError.conflict(`Time slot '${input.timeSlot}' has reached maximum branch capacity (${branch.capacity})`);
    }

    // 6. Calculate Total Price & Fetch Selected Services / Package
    let totalAmount = input.doorstepFee || 0;
    const servicesToAttach: { serviceId?: string; packageId?: string; price: number }[] = [];

    if (input.packageId) {
      const pkg = await prisma.servicePackage.findUnique({ where: { id: input.packageId } });
      if (pkg && pkg.isActive) {
        totalAmount += pkg.price;
        servicesToAttach.push({ packageId: pkg.id, price: pkg.price });
      }
    }

    if (input.serviceIds && input.serviceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: { id: { in: input.serviceIds }, isActive: true },
      });

      for (const service of services) {
        totalAmount += service.price;
        servicesToAttach.push({ serviceId: service.id, price: service.price });
      }
    }

    // If no service attached yet, pick first active service in branch/business
    if (servicesToAttach.length === 0) {
      const fallbackService = await prisma.service.findFirst({
        where: { businessId, isActive: true },
      });

      if (fallbackService) {
        totalAmount += fallbackService.price;
        servicesToAttach.push({ serviceId: fallbackService.id, price: fallbackService.price });
      } else {
        totalAmount += 25.0; // fallback standard price
      }
    }

    // 7. Create Booking Record
    const booking = await prisma.booking.create({
      data: {
        businessId,
        branchId: branch.id,
        customerId: customer.id,
        vehicleId: vehicle.id,
        locationType: input.locationType || ServiceLocationType.IN_BRANCH,
        address: isDoorstep ? input.address?.trim() : null,
        landmark: isDoorstep ? input.landmark?.trim() : null,
        doorstepFee: input.doorstepFee || 0,
        bookingDate: bookingDateObj,
        timeSlot: input.timeSlot,
        totalAmount,
        status: BookingStatus.CONFIRMED,
        notes: input.notes,
        ...(servicesToAttach.length > 0 && {
          bookingServices: {
            create: servicesToAttach,
          },
        }),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        vehicle: { select: { id: true, plateNumber: true, brand: true, model: true, vehicleType: true } },
        branch: { select: { id: true, name: true, address: true } },
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
          customer: { select: { id: true, name: true, phone: true, email: true } },
          vehicle: { select: { id: true, plateNumber: true, brand: true, model: true, vehicleType: true, color: true } },
          branch: { select: { id: true, name: true, address: true } },
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
