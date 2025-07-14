import { EventItem, EventDetailResponse, ScheduleInfo } from './types';
import { findElement } from './dom-utils';
import pLimit from 'p-limit';

const limit = pLimit(1);
let isProcessing = false;

export async function setupEventData(eventData: EventItem[]): Promise<void> {
  if (!eventData || isProcessing) return;
  
  isProcessing = true;
  
  await Promise.all(
    eventData.map(async (item) => {
      const element = findElement(item);
      if (!element) return;
      
      console.log('イベント要素:', element);
      element.style.border = '2px solid red';
      
      const query = new URLSearchParams(location.search);
      const list = document.createElement('div');
      element.appendChild(list);
      list.innerHTML = 'loading...';

      const entranceDate = query.get('entrance_date') || '20250618';
      const ticketIds = query
        .get('id')
        ?.split(',')
        .map((id) => `ticket_ids[]=${id}`)
        .join('&') || '';
      
      const url = `https://ticket.expo2025.or.jp/api/d/events/${item.event_code}?${ticketIds}&entrance_date=${entranceDate}&channel=5`;
      
      try {
        const data = await limit(() => fetch(url));
        const json: EventDetailResponse = await data.json();
        const schedules: ScheduleInfo[] = Object.values(json.event_schedules).map((schedule) => ({
          name: schedule.schedule_name,
          available: schedule.unavailable_reason === 0,
        }));

        if (schedules.filter((schedule) => schedule.available).length === 0) {
          list.innerHTML = '';
          element.style.display = 'none';
          return;
        }
        
        list.innerHTML = '';
        for (const schedule of schedules) {
          const item = document.createElement('div');
          item.innerText = `${schedule.name} - ${schedule.available ? '◯' : '✗'}`;
          item.style.color = schedule.available ? 'green' : 'red';
          list.appendChild(item);
        }
      } catch (error) {
        console.error('イベント詳細の取得に失敗:', error);
        list.innerHTML = 'エラー';
      }
    })
  );
  
  isProcessing = false;
}