import { Request, Response } from 'express';
import { ServiceCatalogService } from './service.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';

export const createService = asyncHandler(async (req: Request, res: Response) => {
  const service = await ServiceCatalogService.createService(req.body, req.user?.businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Service created successfully',
    data: service,
  });
});

export const getServicesByBusiness = asyncHandler(async (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || req.user?.businessId || undefined;
  const includeInactive = req.query.includeInactive === 'true';

  const services = await ServiceCatalogService.getServicesByBusiness(businessId, includeInactive);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Services catalog retrieved successfully',
    data: services,
  });
});

export const getServiceById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const service = await ServiceCatalogService.getServiceById(id);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Service details retrieved successfully',
    data: service,
  });
});

export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await ServiceCatalogService.updateService(
    id,
    req.body,
    req.user?.businessId,
    req.user?.role
  );

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Service updated successfully',
    data: updated,
  });
});

// Service Package Controllers
export const createPackage = asyncHandler(async (req: Request, res: Response) => {
  const pkg = await ServiceCatalogService.createPackage(req.body, req.user?.businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Service package created successfully',
    data: pkg,
  });
});

export const getPackagesByBusiness = asyncHandler(async (req: Request, res: Response) => {
  const businessId = (req.query.businessId as string) || req.user?.businessId || undefined;
  const includeInactive = req.query.includeInactive === 'true';

  const packages = await ServiceCatalogService.getPackagesByBusiness(businessId, includeInactive);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Service packages retrieved successfully',
    data: packages,
  });
});

export const getPackageById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const pkg = await ServiceCatalogService.getPackageById(id);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Package details retrieved successfully',
    data: pkg,
  });
});

export const updatePackage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await ServiceCatalogService.updatePackage(
    id,
    req.body,
    req.user?.businessId,
    req.user?.role
  );

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Service package updated successfully',
    data: updated,
  });
});
