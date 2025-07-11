export interface Devices {
  id: string;
  name: string;
  model: string;
  supported: boolean;
  macAddress: string;
  ipAddress: string;
  state: 'ONLINE' | 'OFFLINE' | 'UPDATING' | 'UNKNOWN';
  firmwareVersion: string;
  firmwareUpdatable: boolean;
  adoptedAt: Date;
}
