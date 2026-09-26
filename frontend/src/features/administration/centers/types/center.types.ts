export type Center = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CenterListItem = Center;

/* -------------------------------------------------------------------------- */
/* List centers                                                               */
/* -------------------------------------------------------------------------- */

export type CenterListResponse = {
  success: true;

  data: {
    data: CenterListItem[];

    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

/* -------------------------------------------------------------------------- */
/* Center detail / mutations                                                  */
/* -------------------------------------------------------------------------- */

export type CenterResponse = {
  success: true;

  data: {
    center: Center;
  };
};

/* -------------------------------------------------------------------------- */
/* Create center                                                              */
/* -------------------------------------------------------------------------- */

export type CreateCenterInput = {
  name: string;
  code: string;
};

/* -------------------------------------------------------------------------- */
/* Update center                                                              */
/* -------------------------------------------------------------------------- */

export type UpdateCenterInput = {
  name?: string;
  code?: string;
};

/* -------------------------------------------------------------------------- */
/* Update center status                                                       */
/* -------------------------------------------------------------------------- */

export type UpdateCenterStatusInput = {
  isActive: boolean;
};

/* -------------------------------------------------------------------------- */
/* Center filters                                                             */
/* -------------------------------------------------------------------------- */

export type CenterFilters = {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};