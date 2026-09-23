export interface TicketCategory {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

export interface TicketSoftware {
  id: number;
  name: string;
  vendor: string | null;
  version: string | null;
  licenseRequired: boolean;
}

export interface CategoriesResponse {
  success: true;
  data: {
    categories: TicketCategory[];
  };
}

export interface SoftwareResponse {
  success: true;
  data: {
    software: TicketSoftware[];
  };
}