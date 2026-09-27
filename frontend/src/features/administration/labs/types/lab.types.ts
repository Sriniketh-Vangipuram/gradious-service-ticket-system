export interface LabCenter {
  id: number;
  name: string;
  code: string;
  isActive?: boolean;
}

export interface LabCounts {
  tickets: number;
  assignedUsers: number;
}

export interface Lab {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  centerId: number;
  createdAt: string;
  updatedAt: string;

  center: LabCenter;

  _count?: LabCounts;
}

/* -------------------------------------------------------------------------- */
/* List response                                                             */
/* -------------------------------------------------------------------------- */

export interface LabListResponse {
  success: true;

  data: {
    data: Lab[];

    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/* -------------------------------------------------------------------------- */
/* Detail / mutation response                                                 */
/* -------------------------------------------------------------------------- */

export interface LabResponse {
  success: true;

  data: {
    lab: Lab;
  };
}

/* -------------------------------------------------------------------------- */
/* Create                                                                     */
/* -------------------------------------------------------------------------- */

export interface CreateLabInput {
  centerId: number;
  name: string;
  code: string;
}

/* -------------------------------------------------------------------------- */
/* Update                                                                     */
/* -------------------------------------------------------------------------- */

export interface UpdateLabInput {
  centerId?: number;
  name?: string;
  code?: string;
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

export interface UpdateLabStatusInput {
  isActive: boolean;
}

/* -------------------------------------------------------------------------- */
/* Filters                                                                    */
/* -------------------------------------------------------------------------- */

export interface LabFilters {
  centerId?: number;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}