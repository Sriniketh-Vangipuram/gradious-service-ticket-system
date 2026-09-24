import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  getValidatedData,
} from "../../../common/validation/validate-request";

import {
  sendSuccess,
} from "../../../common/http/api-response";

import {
  categoryIdParamSchema,
  listCategoriesQuerySchema,
  createCategoryBodySchema,
  updateCategoryBodySchema,
  updateCategoryStatusBodySchema,
} from "./category.schema";

import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
} from "./category.service";

export async function listCategoriesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = getValidatedData(
      req,
      {
        query: listCategoriesQuerySchema,
      },
      "query",
    );

    const result = await listCategories(query);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { categoryId } = getValidatedData(
      req,
      {
        params: categoryIdParamSchema,
      },
      "params",
    );

    const category = await getCategoryById(
      categoryId,
    );

    sendSuccess(res, {
      category,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = getValidatedData(
      req,
      {
        body: createCategoryBodySchema,
      },
      "body",
    );

    const category = await createCategory(body,req.authUser!.userId);

    sendSuccess(
      res,
      {
        category,
      },
      201,
    );
  } catch (error) {
    next(error);
  }
}

export async function updateCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { categoryId } = getValidatedData(
      req,
      {
        params: categoryIdParamSchema,
      },
      "params",
    );

    const body = getValidatedData(
      req,
      {
        body: updateCategoryBodySchema,
      },
      "body",
    );

    const category = await updateCategory(
      categoryId,
      body,
      req.authUser!.userId
    );

    sendSuccess(res, {
      category,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategoryStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { categoryId } = getValidatedData(
      req,
      {
        params: categoryIdParamSchema,
      },
      "params",
    );

    const body = getValidatedData(
      req,
      {
        body: updateCategoryStatusBodySchema,
      },
      "body",
    );

    const category = await updateCategoryStatus(
      categoryId,
      body,
      req.authUser!.userId
    );

    sendSuccess(res, {
      category,
    });
  } catch (error) {
    next(error);
  }
}