export interface Dashboard {
}

export interface SystemMemory {
  total?: number;
  free?: number;
  used?: number;
  max?: number;
}

export interface SystemInfo {
  hostname?: string;
  ipAddress?: string;
  operatingSystem?: string;
  operatingSystemVersion?: string;
  javaVersion?: string;
}

export interface CountData {
  name?: string;
  os?: string;
  browserName?: string;
  quantity?: number;
}
export interface DeviceStatsDTO {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
}
export interface UserRankingDTO {
  fullName: string;
  cpf: string;
  sessionCount: number;
}

export interface NewVsReturningDTO {
  newUsers: number;
  returningUsers: number;
}

export interface SessionTimeStatsDTO {
  averageMinutes: number;
  aboveAverageCount: number;
  belowAverageCount: number;
}

export interface AnalyticsDashboardDTO {
    totalRegisteredUsers: number;
    registeredToday: number;
    uniqueMacsToday: number;
    connectionsToday: number;
    newVsReturning: NewVsReturningDTO;
    sessionTimeStats: SessionTimeStatsDTO;
    topUsersLast30Days: UserRankingDTO[];
}
export interface AdminDashboardData {
  systemMemory?: SystemMemory;
  systemInfo?: SystemInfo;
  osCounts?: CountData[];
  browserCounts?: CountData[];
  validSessionsCount?: number;
  deviceStats?: DeviceStatsDTO
  analytics?: AnalyticsDashboardDTO;
}
