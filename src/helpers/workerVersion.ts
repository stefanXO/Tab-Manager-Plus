"use strict";

// The service worker's version: a hash of the built worker bundle, appended to
// the written worker file as `self.TMP_WORKER_VERSION="…";` by the build
// (scripts/bundle.mjs). The worker answers the `worker_version` command with it
// and the popup compares it with the one it was built to require
// (src/popup/workerCheck.ts), so a popup running against a worker that was not
// reloaded after the worker's code changed can say so.
//
// This module is bundled into the worker, so it holds nothing but the reader: a
// change here changes the worker, and with it the version.

/** The version stamped into this worker, or "" when it was not built by build.mjs. */
export function workerVersion() : string {
	const stamped = (globalThis as { TMP_WORKER_VERSION? : unknown }).TMP_WORKER_VERSION;
	return typeof stamped === "string" ? stamped : "";
}
