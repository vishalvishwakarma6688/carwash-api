import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';

export const createInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await InventoryService.createItem(req.body, req.user?.businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Inventory item created successfully',
    data: item,
  });
});

export const getInventoryItems = asyncHandler(async (req: Request, res: Response) => {
  const branchId = req.query.branchId as string;
  const items = await InventoryService.getItems(req.user?.businessId, branchId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Inventory items retrieved successfully',
    data: items,
  });
});

export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await InventoryService.updateStock(id, req.body);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Inventory stock updated successfully',
    data: updated,
  });
});
