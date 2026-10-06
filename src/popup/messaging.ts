"use strict";

import * as browser from 'webextension-polyfill';
import {ICommand} from '@types';

// Send a command to the service worker and wait until it has been handled, or
// at most `ms`. Use it before window.close(): when the MV3 worker is asleep,
// Chrome queues the message until the worker starts and drops it if the popup
// is gone by then, so a click would close the popup without switching tabs
// (#252, #246, #242). The timeout keeps the popup from hanging.
export async function sendAndWait(command : ICommand, ms = 1500) : Promise<void> {
	let timer : ReturnType<typeof setTimeout> | undefined;
	try {
		await Promise.race([
			browser.runtime.sendMessage<ICommand>(command),
			new Promise<void>(resolve => { timer = setTimeout(resolve, ms); })
		]);
	} catch (e) {
		console.error(e);
	} finally {
		clearTimeout(timer);
	}
}
