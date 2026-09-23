import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  getCategories,
  getSoftware,
} from "./catalog.use-case";

export async function getCategoriesController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const categories = await getCategories();

    return res.status(200).json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getSoftwareController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const software = await getSoftware();

    return res.status(200).json({
      success: true,
      data: {
        software,
      },
    });
  } catch (error) {
    return next(error);
  }
}