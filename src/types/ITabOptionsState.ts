import {IExternalExtension} from "@helpers/external_api";

export interface ITabOptionsState {
	externalApiAllowedExtensions?: IExternalExtension[],
	externalApiPendingRequests?: IExternalExtension[]
}
