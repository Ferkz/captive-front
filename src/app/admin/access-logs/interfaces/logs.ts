export interface Logs {
  id?: number;
  deviceMac: string;
  deviceIp: string;
  accesspointMac: string;
  lastLoginOn: string | Date;
  expireLoginOn: string | Date;
  removeSessionOn: string | Date;
  browser?: string;
  operatingSystem?: string;
}
export interface BackendAccessLogResponse<T> {
  responseId?: number;
  responseDescription?: string;
  payload: T;
}
