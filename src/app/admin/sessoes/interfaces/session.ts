export interface Session {
  id?: number;
  deviceMac: string;
  deviceIp: string;
  accesspointMac?: string;
  lastLoginOn: string | Date;
  expireLoginOn: string | Date;
  removeSessionOn: string | Date;
  browser?: string;
  operatingSystem?: string;
  fullName?: string;
  hostname?: string,
  email?: string;
  phoneNumber?: string;
  acceptedTou?: boolean;
  valid?: boolean;
}

export interface SessionPatchData {
  expireSessionOn?: string | Date;
  removeSessionOn?: string | Date;
}

export interface BackendSessionResponse<T> {
  responseId?: number;
  responseDescription?: string;
  payload: T;
}
