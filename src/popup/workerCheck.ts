"use strict";

// Is the extension's background part (the service worker) the one this popup was
// built for? The build gives the worker a version that is a hash of its code
// (scripts/bundle.mjs) and bakes the same value into the popup. If the extension
// was rebuilt and the worker's code changed but the extension was not reloaded,
// the popup runs new code against an old worker, and what it asks the worker to
// do (a restore, say) misbehaves in ways that look like bugs of the new code. A
// rebuild that leaves the worker's code alone gives the same version and says
// nothing.
//
// The popup asks a moment after it has rendered, never in the way of rendering,
// and only once. The answer counts as stale when it differs, when there is none
// (an older worker does not know the command, so the message resolves with
// nothing) or when the message fails. A worker that does not answer at all in
// time is not told apart from a slow one: no notice.

// set by build.mjs (esbuild define); the popup's own copy of the worker's version
declare const REQUIRED_WORKER_VERSION : string;

/** The version of the worker this bundle was built for. */
export function requiredWorkerVersion() : string {
	return REQUIRED_WORKER_VERSION;
}

/** Wait this long after the popup was mounted before asking: the first frames are not delayed by it. */
export const CHECK_DELAY_MS = 1500;
/** A worker that has not answered after this long is left alone. */
export const ANSWER_TIMEOUT_MS = 5000;

/** What the check found: the worker is "current", "stale", or did not answer in time ("unknown"). */
export type WorkerState = "current" | "stale" | "unknown";

/** The decision on an answer: only the very version the popup requires is current. */
export function workerState(required : string, answer : unknown) : WorkerState {
	return answer === required ? "current" : "stale";
}

const TIMED_OUT = Symbol("timed out");

/** Asks the worker (`ask` sends the command) and decides; a rejected message is a stale worker. */
export async function checkWorker(ask : () => Promise<unknown>, required : string, timeoutMs = ANSWER_TIMEOUT_MS) : Promise<WorkerState> {
	let timer : ReturnType<typeof setTimeout> | undefined;
	const silent = new Promise<symbol>((resolve) => { timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs); });
	try {
		const answer = await Promise.race([ask(), silent]);
		return answer === TIMED_OUT ? "unknown" : workerState(required, answer);
	} catch {
		return "stale";
	} finally {
		clearTimeout(timer);
	}
}

/** The text of the red notice. */
export function staleWorkerText(firefox : boolean) : string {
	return "The background part of Tab Manager Plus is out of date. Reload the extension in "
		+ (firefox ? "about:debugging" : "chrome://extensions") + ".";
}

export interface WorkerCheckOptions {
	ask : () => Promise<unknown>;
	required : string;
	/** called once, when the worker turned out to be stale */
	onStale : () => void;
	delayMs? : number;
	timeoutMs? : number;
	/** injectable for tests */
	setTimer? : (run : () => void, ms : number) => unknown;
	clearTimer? : (timer : unknown) => void;
}

/**
 * Schedules the check `delayMs` from now, off the render path; the returned
 * function cancels it (the popup closing first): nothing is asked, or the answer
 * is dropped, and onStale is not called after it.
 */
export function scheduleWorkerCheck(options : WorkerCheckOptions) : () => void {
	const setTimer = options.setTimer ?? ((run, ms) => setTimeout(run, ms));
	const clearTimer = options.clearTimer ?? ((timer) => clearTimeout(timer as ReturnType<typeof setTimeout>));
	let cancelled = false;
	const timer = setTimer(() => {
		if (cancelled) return;
		checkWorker(options.ask, options.required, options.timeoutMs).then((state) => {
			if (!cancelled && state === "stale") options.onStale();
		});
	}, options.delayMs ?? CHECK_DELAY_MS);
	return () => {
		cancelled = true;
		clearTimer(timer);
	};
}
