import {getLocalStorage, setLocalStorage} from "@helpers/storage";
import {ISavedSession} from "@types";
import * as browser from 'webextension-polyfill';

export const externalAccessKey = "externalApiAccess";
export const externalPendingRequestsKey = "externalApiPendingRequests";
export const externalSavedSessionsMethod = "tabManagerPlus.getSavedSessions";

export interface IExternalExtension {
	id: string,
	name: string,
	requestedAt?: number,
	approvedAt?: number
}

export interface IExternalApiAccess {
	allowedExtensions: IExternalExtension[]
}

export interface IExternalSavedTab {
	title: string,
	url: string,
	favIconUrl?: string
}

export interface IExternalSavedSession {
	id: string,
	name: string,
	date: number,
	tabs: IExternalSavedTab[]
}

export async function getExternalApiAccess(): Promise<IExternalApiAccess> {
	const access = await getLocalStorage(externalAccessKey, {});
	return {
		allowedExtensions: Array.isArray(access.allowedExtensions) ? access.allowedExtensions : []
	};
}

export async function getExternalApiPendingRequests(): Promise<IExternalExtension[]> {
	const requests = await getLocalStorage(externalPendingRequestsKey, []);
	return Array.isArray(requests) ? requests : [];
}

export async function rememberExternalApiRequest(extensionId: string, displayName?: string): Promise<void> {
	const requests = await getExternalApiPendingRequests();
	const name = displayName && displayName.trim() ? displayName.trim() : "Unknown extension";
	const nextRequests = requests.filter((request) => request.id !== extensionId);
	nextRequests.push({
		id: extensionId,
		name: name,
		requestedAt: Date.now()
	});
	await setLocalStorage(externalPendingRequestsKey, nextRequests);
}

export async function approveExternalApiRequest(request: IExternalExtension): Promise<void> {
	const access = await getExternalApiAccess();
	const requests = await getExternalApiPendingRequests();
	const allowedExtensions = access.allowedExtensions.filter((extension) => extension.id !== request.id);
	allowedExtensions.push({
		id: request.id,
		name: request.name || "Unknown extension",
		approvedAt: Date.now()
	});
	await setLocalStorage(externalAccessKey, {allowedExtensions});
	await setLocalStorage(externalPendingRequestsKey, requests.filter((item) => item.id !== request.id));
}

export async function denyExternalApiRequest(extensionId: string): Promise<void> {
	const requests = await getExternalApiPendingRequests();
	await setLocalStorage(externalPendingRequestsKey, requests.filter((item) => item.id !== extensionId));
}

export async function removeAllowedExternalApiExtension(extensionId: string): Promise<void> {
	const access = await getExternalApiAccess();
	await setLocalStorage(externalAccessKey, {
		allowedExtensions: access.allowedExtensions.filter((extension) => extension.id !== extensionId)
	});
}

export async function handleExternalApiMessage(message, sender) {
	if (!message || message.method !== externalSavedSessionsMethod) {
		return;
	}

	const extensionId = sender && sender.id;
	if (!extensionId) {
		return {
			ok: false,
			error: "missing_sender_id",
			message: "Tab Manager Plus could not identify the requesting extension."
		};
	}

	const access = await getExternalApiAccess();
	const allowed = access.allowedExtensions.some((extension) => extension.id === extensionId);
	if (!allowed) {
		await rememberExternalApiRequest(extensionId, message.displayName);
		await browser.tabs.create({url: browser.runtime.getURL("options.html")});
		return {
			ok: false,
			error: "approval_required",
			message: "Approve this extension in Tab Manager Plus options, then request saved sessions again."
		};
	}

	return {
		ok: true,
		sessions: await getExternalSavedSessions()
	};
}

export async function getExternalSavedSessions(): Promise<IExternalSavedSession[]> {
	const values = await getLocalStorage("sessions", {});
	return Object.keys(values)
		.map((key) => normalizeExternalSession(values[key]))
		.filter((session) => !!session);
}

function normalizeExternalSession(session: ISavedSession): IExternalSavedSession | null {
	if (!session || !session.id || !Array.isArray(session.tabs)) {
		return null;
	}

	const tabs = session.tabs
		.map((tab) => {
			const url = tab.url || tab.pendingUrl;
			if (!url || !/^https?:\/\//i.test(url)) {
				return null;
			}
			return {
				title: tab.title || "",
				url: url,
				...(tab.favIconUrl ? {favIconUrl: tab.favIconUrl} : {})
			};
		})
		.filter((tab) => !!tab);

	if (tabs.length === 0) {
		return null;
	}

	return {
		id: session.id,
		name: session.name || "",
		date: session.date || session.sessionStartTime || Date.now(),
		tabs: tabs
	};
}
