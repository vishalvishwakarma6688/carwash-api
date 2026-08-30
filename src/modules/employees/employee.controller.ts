import { Request, Response } from 'express';
import { EmployeeService } from './employee.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import { HTTP_STATUS } from '../../constants/httpStatusCodes';

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await EmployeeService.createEmployee(req.body, req.user?.businessId);
  return sendResponse({
    res,
    statusCode: HTTP_STATUS.CREATED,
    message: 'Employee record created successfully',
    data: employee,
  });
});

export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const branchId = req.query.branchId as string;
  const employees = await EmployeeService.getEmployees(req.user?.businessId, branchId);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Employees retrieved successfully',
    data: employees,
  });
});

export const getEmployeeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const employee = await EmployeeService.getEmployeeById(id);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Employee details retrieved successfully',
    data: employee,
  });
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await EmployeeService.updateEmployee(id, req.body);

  return sendResponse({
    res,
    statusCode: HTTP_STATUS.OK,
    message: 'Employee record updated successfully',
    data: updated,
  });
});
