export interface EventItem {
  event_code: string;
  event_name: string;
  virtual_url: string;
  portal_url: string;
  date_status: number;
}

export interface EventSchedule {
  schedule_name: string;
  unavailable_reason: number;
}

export interface EventDetailResponse {
  event_schedules: Record<string, EventSchedule>;
}

export interface EventApiResponse {
  list: EventItem[];
}

export interface ScheduleInfo {
  name: string;
  available: boolean;
}