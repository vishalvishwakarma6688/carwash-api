import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { CreatePaymentInput } from './payment.schema';
import { PaymentStatus } from '@prisma/client';

export class PaymentService {
  /**
   * Process a Payment transaction, update Booking payment status, and award loyalty points
   */
  static async processPayment(input: CreatePaymentInput, userBusinessId?: string | null) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { customer: true },
    });

    if (!booking) {
      throw ApiError.notFound('Associated booking not found');
    }

    if (userBusinessId && booking.businessId !== userBusinessId) {
      throw ApiError.forbidden('Access denied to process payment for this booking');
    }

    const transactionId = input.transactionId || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          businessId: booking.businessId,
          bookingId: booking.id,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          status: PaymentStatus.PAID,
          transactionId,
        },
      });

      // 2. Calculate Total Paid Amount for Booking
      const totalPaidResult = await tx.payment.aggregate({
        where: { bookingId: booking.id, status: PaymentStatus.PAID },
        _sum: { amount: true },
      });

      const totalPaid = totalPaidResult._sum.amount || 0;
      const isFullyPaid = totalPaid >= booking.totalAmount;

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING,
        },
      });

      // 3. Award Loyalty Points ($1 spent = 1 Point)
      const pointsEarned = Math.floor(input.amount);
      if (pointsEarned > 0 && booking.customerId) {
        await tx.loyaltyAccount.upsert({
          where: { customerId: booking.customerId },
          create: {
            customerId: booking.customerId,
            pointsBalance: pointsEarned,
          },
          update: {
            pointsBalance: { increment: pointsEarned },
          },
        });
      }

      return payment;
    });

    return result;
  }

  /**
   * Get Payments list
   */
  static async getPayments(
    userBusinessId?: string | null,
    branchId?: string,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userBusinessId) {
      where.booking = { businessId: userBusinessId };
    }
    if (branchId) {
      where.booking = { ...where.booking, branchId };
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              customer: { select: { name: true, phone: true } },
              vehicle: { select: { plateNumber: true } },
              branch: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Payment by ID
   */
  static async getPaymentById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: true,
            vehicle: true,
            branch: true,
            bookingServices: { include: { service: true, package: true } },
          },
        },
      },
    });

    if (!payment) {
      throw ApiError.notFound('Payment record not found');
    }

    return payment;
  }
}
