export interface EventItem {
  id: number;
  event_code: string;
  event_name: string;
  program_code: string;
  event_summary: string;
  virtual_url: string;
  virtual_url_desc: string;
  portal_url: string;
  portal_url_desc: string;
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
  exists_next: boolean;
  next_token: string;
}

export interface ScheduleInfo {
  name: string;
  available: boolean;
}