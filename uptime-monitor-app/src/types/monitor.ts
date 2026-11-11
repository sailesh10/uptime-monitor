export type MonitorStatus = "up" | "down" | "pending";

export interface Monitor {
  id: string;
  name: string;
  url: string;
  status: MonitorStatus;
  uptime: number | null;
  responseTime: number | null;
  lastChecked: string | null;
  statusCode?: number | null;
}
