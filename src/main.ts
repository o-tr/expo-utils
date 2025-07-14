import { EventItem } from './types';
import { setupXhrProxy } from './xhr-proxy';
import { setupEventData } from './event-processor';
import { injectStyles, setupLoadMoreButton } from './dom-utils';

(function (): void {
  'use strict';

  let eventData: EventItem[] | null = null;
  
  setupXhrProxy((data) => {
    eventData = data;
  });

  injectStyles();

  let isFirstLoad = true;
  setTimeout(() => {
    setInterval(() => {
      if (eventData && isFirstLoad) {
        setupEventData(eventData);
        isFirstLoad = false;
      }
      setupLoadMoreButton();
    }, 1000);
  }, 1000);

})();