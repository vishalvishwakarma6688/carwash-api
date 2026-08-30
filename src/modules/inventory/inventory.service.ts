import { prisma } from '../../config/db';
import { ApiError } from '../../utils/apiError';
import { CreateInventoryItemInput, UpdateStockInput } from './inventory.schema';

export class InventoryService {
  static async createItem(input: CreateInventoryItemInput, userBusinessId?: string | null) {
    const branch = await prisma.branch.findUnique({
      where: { id: input.branchId },
    });

    if (!branch) {
      throw ApiError.notFound('Associated branch not found');
    }

    const businessId = branch.businessId;

    if (userBusinessId && businessId !== userBusinessId) {
      throw ApiError.forbidden('Access denied to branch inventory');
    }

    const item = await prisma.inventoryItem.create({
      data: {
        businessId,
        branchId: input.branchId,
        name: input.name,
        sku: input.sku,
        quantity: input.quantity || 0,
        minStockLevel: input.minStockLevel || 10,
        unitPrice: input.unitPrice || 0,
      },
    });

    return item;
  }

  static async getItems(userBusinessId?: string | null, branchId?: string) {
    const where: any = {};
    if (userBusinessId) {
      where.businessId = userBusinessId;
    }
    if (branchId) {
      where.branchId = branchId;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { branch: { select: { name: true } } },
    });

    return items.map((item) => ({
      ...item,
      isLowStock: item.quantity <= item.minStockLevel,
    }));
  }

  static async updateStock(id: string, input: UpdateStockInput) {
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });

    if (!existing) {
      throw ApiError.notFound('Inventory item not found');
    }

    let newQuantity = existing.quantity;
    if (input.quantityDelta !== undefined) {
      newQuantity = Math.max(0, existing.quantity + input.quantityDelta);
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: newQuantity,
        ...(input.minStockLevel !== undefined && { minStockLevel: input.minStockLevel }),
        ...(input.unitPrice !== undefined && { unitPrice: input.unitPrice }),
        ...(input.name && { name: input.name }),
      },
    });

    return {
      ...updated,
      isLowStock: updated.quantity <= updated.minStockLevel,
    };
  }
}
