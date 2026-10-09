"use strict";

import * as React from "react";
import {StatsCard} from "./StatsCard";
import {Rect} from "../stats";
import {StatsHover, StatsSource, StatsView, IStatsTarget} from "../statsHover";

export type {IStatsTarget, StatsSource} from "../statsHover";

interface IStatsLayerProps {
	// the manager's data the cards are built from
	source : StatsSource;
	// bumped whenever the manager's data changed: an open card is built again
	// (header-only updates, like the hover text, leave it alone)
	version : number;
}

interface IStatsLayerState {
	target : IStatsTarget | null;
	zoom : { tabId : number, zoom : number } | null;
}

// Owns the stats card: its state, its one element, and the hover controller
// (../statsHover.ts) that decides when it opens. Mounted once with the popup
// and never unmounted, so opening, swapping (tab to tab) and closing touch
// the card alone: a new card is one render of this subtree, never of
// TabManager, every window and tile (with a few hundred tabs that was
// 70-160 ms per swap); closing and following the pointer are plain DOM writes.
export class StatsLayer extends React.Component<IStatsLayerProps, IStatsLayerState> implements StatsView {
	private readonly cardRef : React.RefObject<StatsCard> = React.createRef();
	private readonly layerRef : React.RefObject<HTMLDivElement> = React.createRef();
	private readonly hover : StatsHover;
	// set synchronously, so a second event in the same frame already sees it
	private open = false;

	constructor(props : IStatsLayerProps) {
		super(props);
		this.state = { target: null, zoom: null };
		this.hover = new StatsHover(this, props.source);
	}

	// the pointer and the keys over the element the layer is rendered in (the
	// popup's #root) drive the card. (Not a ref of TabManager's: a parent's
	// refs are not attached yet when a child mounts.)
	componentDidMount() {
		const root = this.layerRef.current?.parentElement;
		if (root) this.hover.attach(root);
	}

	componentWillUnmount() {
		this.hover.detach();
	}

	// the data changed under an action button's card: a click may have taken
	// the button away (a window closed, Minimize swapped for Maximize), which
	// only shows once the popup's new DOM is in, as now
	componentDidUpdate() {
		const t = this.state.target;
		if (this.open && t && t.element && !t.element.isConnected) this.hover.close();
	}

	// only its own state, or the data behind an open card
	shouldComponentUpdate(next : IStatsLayerProps, nextState : IStatsLayerState) : boolean {
		return nextState !== this.state || (this.open && next.version !== this.props.version);
	}

	isOpen() : boolean {
		return this.open;
	}

	current() : IStatsTarget | null {
		return this.open ? this.state.target : null;
	}

	show(target : IStatsTarget, zoom : number | undefined) {
		this.open = true;
		this.setState({ target, zoom: zoom === undefined ? null : { tabId: target.id, zoom } });
	}

	// tabs.getZoom answered: shown only if that tab's card is still up
	// (an updater: the show() before it may not have been rendered yet)
	setZoom(tabId : number, zoom : number) {
		if (!this.open) return;
		this.setState((prev) => {
			const t = prev.target;
			return t && t.kind === "tab" && t.id === tabId ? { zoom: { tabId, zoom } } : null;
		});
	}

	// the keyboard's card: its row moved (scroll)
	reanchor(anchor : Rect) {
		this.setState((prev) => (prev.target && prev.target.anchor ? { target: { ...prev.target, anchor } } : null));
	}

	// no render: the card parks itself (the last content stays, hidden)
	close() {
		if (!this.open) return;
		this.open = false;
		this.cardRef.current?.hide();
	}

	follow(x : number, y : number) {
		if (this.open) this.cardRef.current?.follow(x, y);
	}

	refresh() {
		if (this.open) this.forceUpdate();
	}

	render() {
		const t = this.state.target;
		const zoom = t && this.state.zoom && this.state.zoom.tabId === t.id ? this.state.zoom.zoom : undefined;
		const content = t && this.open ? this.hover.resolve(t, zoom) : null;
		// one card element for the popup's life, inside a viewport-sized, fully
		// contained layer: the card's content changes with every tab it
		// follows, and without the containment each change laid out the whole
		// popup again (40-80 ms with ~200 tiles)
		return (
			<div className="stats-layer" ref={this.layerRef}>
				<StatsCard ref={this.cardRef} content={content} shown={this.open} pointer={t ? t.pointer : undefined} anchor={t ? t.anchor : undefined} avoid={t ? t.avoid : undefined} />
			</div>
		);
	}
}
