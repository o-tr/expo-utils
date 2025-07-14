import { EventItem } from './types';

export function findElement(item: EventItem): HTMLElement | null {
  const virtualUrlElem = Array.from(
    document.querySelectorAll(`a[href="${item.virtual_url}"]`)
  ).find((elem) => {
    const titleElem = elem.parentElement?.parentElement?.getElementsByClassName(
      'style_search_item_title__aePLg'
    )[0] as HTMLElement;
    
    console.log(elem, titleElem?.innerText, item.event_name);
    return titleElem?.innerText === item.event_name;
  });
  
  if (virtualUrlElem) {
    return virtualUrlElem.parentElement?.parentElement as HTMLElement;
  }
  
  const portalUrlElem = Array.from(
    document.querySelectorAll(`a[href="${item.portal_url}"]`)
  ).find((elem) => {
    const titleElem = elem.parentElement?.parentElement?.getElementsByClassName(
      'style_search_item_title__aePLg'
    )[0] as HTMLElement;
    
    console.log(elem, titleElem?.innerText, item.event_name);
    return titleElem?.innerText === item.event_name;
  });
  
  return portalUrlElem?.parentElement?.parentElement as HTMLElement || null;
}

export function injectStyles(): void {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `.style_search_item_note__vExQQ,.style_event_links__jS3Q_,.style_search_item_row__moqWC:has(img[src*="calendar_none.svg"]) {display: none !important;}.style_search_item_note__vExQQ,.style_event_links__jS3Q_,.style_search_item_row__moqWC:has(img[src*="calendar_none.svg"]),.style_time_picker__wrap__UBImr:has(.style_time_picker__disabled___yvRh) {display: none !important;} div:has(> .style_loader__eoj1P){left:0;top:0;position:fixed;}`;
  document.body.append(styleElement);
}

export function setupLoadMoreButton(): void {
  const loadMoreButton = document.getElementsByClassName('style_more_btn__ymb22')?.[0] as HTMLButtonElement;
  if (!loadMoreButton || loadMoreButton.disabled) return;
  loadMoreButton.click();
}