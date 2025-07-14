// ==UserScript==
// @name         expo utils
// @namespace    https://ootr.jp/
// @version      1.0.0
// @description  Expo utility userscript
// @author       ootr
// @match        https://ticket.expo2025.or.jp/event_search/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ticket.expo2025.or.jp
// @grant        none
// ==/UserScript==
(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
})((function () { 'use strict';

    function rewriteUrlIfNeeded(url) {
        if (url.match(/https:\/\/ticket\.expo2025\.or\.jp\/api\/d\/events\?.*limit=\d+.*/)) {
            return url.replace(/https:\/\/ticket\.expo2025\.or\.jp\/api\/d\/events\?(.*)limit=\d+(.*)/, 'https://ticket.expo2025.or.jp/api/d/events?$1limit=100$2');
        }
        return url;
    }

    function setupXhrProxy(onEventDataReceived) {
        const OriginalXHR = window.XMLHttpRequest;
        const handler = {
            construct(target, args) {
                const xhr = new target(...args);
                let lastUrl = null;
                const openProxy = new Proxy(xhr.open, {
                    apply(openTarget, thisArg, openArgs) {
                        if (typeof openArgs[1] === 'string') {
                            openArgs[1] = rewriteUrlIfNeeded(openArgs[1]);
                            lastUrl = openArgs[1];
                        }
                        return openTarget.apply(xhr, openArgs);
                    },
                });
                xhr.addEventListener('load', function () {
                    if (lastUrl && lastUrl.startsWith('https://ticket.expo2025.or.jp/api/d/events')) {
                        if (xhr.responseType === '' || xhr.responseType === 'text') {
                            try {
                                const data = JSON.parse(xhr.responseText);
                                const availableEvents = data.list.filter((item) => item.date_status < 2);
                                onEventDataReceived(availableEvents);
                                console.log('イベントAPIレスポンス:', availableEvents);
                            }
                            catch (e) {
                                console.error('JSONパースエラー:', e);
                                console.log('イベントAPIレスポンス(生):', xhr.responseText);
                            }
                        }
                        else {
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

    function findElement(item) {
        const virtualUrlElem = Array.from(document.querySelectorAll(`a[href="${item.virtual_url}"]`)).find((elem) => {
            const titleElem = elem.parentElement?.parentElement?.getElementsByClassName('style_search_item_title__aePLg')[0];
            console.log(elem, titleElem?.innerText, item.event_name);
            return titleElem?.innerText === item.event_name;
        });
        if (virtualUrlElem) {
            return virtualUrlElem.parentElement?.parentElement;
        }
        const portalUrlElem = Array.from(document.querySelectorAll(`a[href="${item.portal_url}"]`)).find((elem) => {
            const titleElem = elem.parentElement?.parentElement?.getElementsByClassName('style_search_item_title__aePLg')[0];
            console.log(elem, titleElem?.innerText, item.event_name);
            return titleElem?.innerText === item.event_name;
        });
        return portalUrlElem?.parentElement?.parentElement || null;
    }
    function injectStyles() {
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `.style_search_item_note__vExQQ,.style_event_links__jS3Q_,.style_search_item_row__moqWC:has(img[src*="calendar_none.svg"]) {display: none !important;}.style_search_item_note__vExQQ,.style_event_links__jS3Q_,.style_search_item_row__moqWC:has(img[src*="calendar_none.svg"]),.style_time_picker__wrap__UBImr:has(.style_time_picker__disabled___yvRh) {display: none !important;} div:has(> .style_loader__eoj1P){left:0;top:0;position:fixed;}`;
        document.body.append(styleElement);
    }
    function setupLoadMoreButton() {
        const loadMoreButton = document.getElementsByClassName('style_more_btn__ymb22')?.[0];
        if (!loadMoreButton || loadMoreButton.disabled)
            return;
        loadMoreButton.click();
    }

    /*
    How it works:
    `this.#head` is an instance of `Node` which keeps track of its current value and nests another instance of `Node` that keeps the value that comes after it. When a value is provided to `.enqueue()`, the code needs to iterate through `this.#head`, going deeper and deeper to find the last value. However, iterating through every single item is slow. This problem is solved by saving a reference to the last value as `this.#tail` so that it can reference it to add a new value.
    */

    class Node {
    	value;
    	next;

    	constructor(value) {
    		this.value = value;
    	}
    }

    class Queue {
    	#head;
    	#tail;
    	#size;

    	constructor() {
    		this.clear();
    	}

    	enqueue(value) {
    		const node = new Node(value);

    		if (this.#head) {
    			this.#tail.next = node;
    			this.#tail = node;
    		} else {
    			this.#head = node;
    			this.#tail = node;
    		}

    		this.#size++;
    	}

    	dequeue() {
    		const current = this.#head;
    		if (!current) {
    			return;
    		}

    		this.#head = this.#head.next;
    		this.#size--;
    		return current.value;
    	}

    	peek() {
    		if (!this.#head) {
    			return;
    		}

    		return this.#head.value;

    		// TODO: Node.js 18.
    		// return this.#head?.value;
    	}

    	clear() {
    		this.#head = undefined;
    		this.#tail = undefined;
    		this.#size = 0;
    	}

    	get size() {
    		return this.#size;
    	}

    	* [Symbol.iterator]() {
    		let current = this.#head;

    		while (current) {
    			yield current.value;
    			current = current.next;
    		}
    	}

    	* drain() {
    		while (this.#head) {
    			yield this.dequeue();
    		}
    	}
    }

    function pLimit(concurrency) {
    	validateConcurrency(concurrency);

    	const queue = new Queue();
    	let activeCount = 0;

    	const resumeNext = () => {
    		if (activeCount < concurrency && queue.size > 0) {
    			queue.dequeue()();
    			// Since `pendingCount` has been decreased by one, increase `activeCount` by one.
    			activeCount++;
    		}
    	};

    	const next = () => {
    		activeCount--;

    		resumeNext();
    	};

    	const run = async (function_, resolve, arguments_) => {
    		const result = (async () => function_(...arguments_))();

    		resolve(result);

    		try {
    			await result;
    		} catch {}

    		next();
    	};

    	const enqueue = (function_, resolve, arguments_) => {
    		// Queue `internalResolve` instead of the `run` function
    		// to preserve asynchronous context.
    		new Promise(internalResolve => {
    			queue.enqueue(internalResolve);
    		}).then(
    			run.bind(undefined, function_, resolve, arguments_),
    		);

    		(async () => {
    			// This function needs to wait until the next microtask before comparing
    			// `activeCount` to `concurrency`, because `activeCount` is updated asynchronously
    			// after the `internalResolve` function is dequeued and called. The comparison in the if-statement
    			// needs to happen asynchronously as well to get an up-to-date value for `activeCount`.
    			await Promise.resolve();

    			if (activeCount < concurrency) {
    				resumeNext();
    			}
    		})();
    	};

    	const generator = (function_, ...arguments_) => new Promise(resolve => {
    		enqueue(function_, resolve, arguments_);
    	});

    	Object.defineProperties(generator, {
    		activeCount: {
    			get: () => activeCount,
    		},
    		pendingCount: {
    			get: () => queue.size,
    		},
    		clearQueue: {
    			value() {
    				queue.clear();
    			},
    		},
    		concurrency: {
    			get: () => concurrency,

    			set(newConcurrency) {
    				validateConcurrency(newConcurrency);
    				concurrency = newConcurrency;

    				queueMicrotask(() => {
    					// eslint-disable-next-line no-unmodified-loop-condition
    					while (activeCount < concurrency && queue.size > 0) {
    						resumeNext();
    					}
    				});
    			},
    		},
    	});

    	return generator;
    }

    function validateConcurrency(concurrency) {
    	if (!((Number.isInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency > 0)) {
    		throw new TypeError('Expected `concurrency` to be a number from 1 and up');
    	}
    }

    const limit = pLimit(1);
    let isProcessing = false;
    async function setupEventData(eventData) {
        if (!eventData || isProcessing)
            return;
        isProcessing = true;
        await Promise.all(eventData.map(async (item) => {
            const element = findElement(item);
            if (!element)
                return;
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
                const json = await data.json();
                const schedules = Object.values(json.event_schedules).map((schedule) => ({
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
            }
            catch (error) {
                console.error('イベント詳細の取得に失敗:', error);
                list.innerHTML = 'エラー';
            }
        }));
        isProcessing = false;
    }

    (function () {
        let eventData = null;
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

}));
