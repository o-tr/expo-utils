import { EventApiResponse, EventItem } from './types';
import { rewriteUrlIfNeeded } from './url-utils';

export function setupXhrProxy(onEventDataReceived: (data: EventItem[]) => void): void {
  const OriginalXHR = window.XMLHttpRequest;

  const handler: ProxyHandler<typeof XMLHttpRequest> = {
    construct(target, args: any[]) {
      const xhr = new target(...(args as []));

      let lastUrl: string | null = null;
      const openProxy = new Proxy(xhr.open, {
        apply(openTarget, thisArg, openArgs: any[]) {
          if (typeof openArgs[1] === 'string') {
            openArgs[1] = rewriteUrlIfNeeded(openArgs[1]);
            lastUrl = openArgs[1];
          }
          return openTarget.apply(xhr, openArgs as any);
        },
      });

      xhr.addEventListener('load', function () {
        if (lastUrl && lastUrl.startsWith('https://ticket.expo2025.or.jp/api/d/events')) {
          if (xhr.responseType === '' || xhr.responseType === 'text') {
            try {
              const data: EventApiResponse = JSON.parse(xhr.responseText);
              const availableEvents = data.list.filter((item) => item.date_status < 2);
              onEventDataReceived(availableEvents);
              console.log('イベントAPIレスポンス:', availableEvents);
            } catch (e) {
              console.error('JSONパースエラー:', e);
              console.log('イベントAPIレスポンス(生):', xhr.responseText);
            }
          } else {
            console.log('イベントAPIレスポンス:', xhr.response);
          }
        }
      });

      xhr.open = openProxy;
      return xhr;
    },
  };

  window.XMLHttpRequest = new Proxy(OriginalXHR, handler);
}