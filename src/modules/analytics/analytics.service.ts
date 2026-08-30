import { prisma } from '../../config/db';
import { BookingStatus, PaymentStatus, QueueStatus } from '@prisma/client';

export class AnalyticsService {
  /**
   * Aggregate Operational & Financial Metrics for a Business
   */
  static async getDashboardMetrics(businessId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalBranches,
      totalCustomers,
      todayBookingsCount,
      activeQueueCount,
      todayRevenueAggregate,
      paymentMethodBreakdown,
    ] = await Promise.all([
      prisma.branch.count({ where: { businessId, isActive: true } }),
      prisma.customer.count({ where: { businessId } }),
      prisma.booking.count({
        where: {
          businessId,
          bookingDate: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.queueItem.count({
        where: {
          branch: { businessId },
          status: { in: [QueueStatus.WAITING, QueueStatus.ASSIGNED, QueueStatus.IN_PROGRESS] },
        },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { businessId },
          status: PaymentStatus.PAID,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          booking: { businessId },
          status: PaymentStatus.PAID,
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      summary: {
        totalBranches,
        totalCustomers,
        todayBookings: todayBookingsCount,
        activeCarsInQueue: activeQueueCount,
        todayRevenue: todayRevenueAggregate._sum.amount || 0,
      },
      paymentMethodBreakdown: paymentMethodBreakdown.map((item) => ({
        method: item.paymentMethod,
        totalRevenue: item._sum.amount || 0,
        transactionCount: item._count.id,
      })),
    };
  }

  /**
   * Get Popular Services Ranking
   */
  static async getPopularServices(businessId: string) {
    const popularServices = await prisma.bookingService.groupBy({
      by: ['serviceId'],
      where: {
        booking: { businessId, status: BookingStatus.COMPLETED },
        serviceId: { not: null },
      },
      _count: { id: true },
      _sum: { price: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const serviceDetails = await Promise.all(
      popularServices.map(async (ps) => {
        if (!ps.serviceId) return null;
        const service = await prisma.service.findUnique({
          where: { id: ps.serviceId },
          select: { name: true, price: true },
        });
        return {
          serviceId: ps.serviceId,
          name: service?.name || 'Unknown',
          completedCount: ps._count.id,
          totalRevenueGenerated: ps._sum.price || 0,
        };
      })
    );

    return serviceDetails.filter(Boolean);
  }
}
