import { Request, Response } from 'express';
import { VehicleService } from './vehicle.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await VehicleService.createVehicle(req.body, req.user?.businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Vehicle registered successfully',
    data: vehicle,
  });
});

export const getVehiclesByCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const vehicles = await VehicleService.getVehiclesByCustomer(customerId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Customer vehicles retrieved successfully',
    data: vehicles,
  });
});

export const getVehicleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const vehicle = await VehicleService.getVehicleById(id);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Vehicle details retrieved successfully',
    data: vehicle,
  });
});

export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await VehicleService.updateVehicle(id, req.body);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Vehicle updated successfully',
    data: updated,
  });
});

export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await VehicleService.deleteVehicle(id);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Vehicle deleted successfully',
  });
});
