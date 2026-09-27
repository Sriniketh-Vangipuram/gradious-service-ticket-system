export interface Software {
  id: number;
  name: string;
  vendor: string | null;
  version: string | null;
  licenseRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  _count?: {
    tickets: number;
  };
}

export interface SoftwareListResponse {
  success: true;

  data: {
    data: Software[];

    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface SoftwareResponse {
  success: true;

  data: {
    software: Software;
  };
}

export interface CreateSoftwareInput {
  name: string;
  vendor?: string | null;
  version?: string | null;
  licenseRequired?: boolean;
}

export interface UpdateSoftwareInput {
  name?: string;
  vendor?: string | null;
  version?: string | null;
  licenseRequired?: boolean;
}

export interface UpdateSoftwareStatusInput {
  isActive: boolean;
}

export interface SoftwareFilters {
  search?: string;
  vendor?: string;
  isActive?: boolean;
  licenseRequired?: boolean;
  page?: number;
  limit?: number;
}
