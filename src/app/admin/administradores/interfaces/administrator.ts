export interface Administrator {
  id?: number;
  email: string;
  fullName: string;
  creationDate?: string | Date;
  lastModification?: string | Date;
  enabled?: boolean;
  password?: string;
}
export interface BackendAdminResponse<T> {
  responseId?: number;
  responseDescription?: string;
  payload: T;
}
export interface AdministratorAddRequest {
  fullName: string;
  email: string;
  password?: string;
  enabled?: boolean;
}
