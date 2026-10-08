"use strict";

import * as React from "react";
import {StatsCard as IStatsCard, StatsIcon, StatsLine, Rect, MonitorMap, MapRect, placeCard, placeAtPointer, splitUrl} from "../stats";
import {FaviconTone} from "@helpers/favicon";

// a favicon as the tile resolved it, with the tone the tile measured
export interface IStatsFavicon {
	// null: the tab has none; the card shows the tile's page icon
	src : string | null;
	tone : FaviconTone;
}

// what a card shows
export interface IStatsCardContent {
	card : IStatsCard;
	// tab card: the tile's favicon and the tab's url
	icon? : IStatsFavicon;
	url? : string;
	// window card: favicons of its biggest sites, and the monitor map
	sites? : IStatsFavicon[];
	map? : MonitorMap | null;
}

interface IStatsCardProps {
	// what to show; null: nothing (the card stays parked)
	content : IStatsCardContent | null;
	// the card is up (StatsLayer's open flag at render time)
	shown : boolean;
	// where it opens: at the pointer (and then follows it, see follow()), or
	// next to an element (the keyboard's selected row), viewport coordinates
	pointer? : { x : number, y : number };
	anchor? : Rect;
}

// where a hidden card waits: far off screen, so it never covers anything
const PARKED = "translate3d(-10000px, -10000px, 0)";

// the pictures no image in images/ has: a clock (active …), a globe (the url
// line, sites) and the rest of the line drawings (StatsIcon); strokes in the
// text colour, drawn at the badges' 12px
const svgProps = { viewBox: "0 0 16 16", width: 12, height: 12, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
// the clock of the "active" line
export const CLOCK = <svg {...svgProps}><circle cx="8" cy="8" r="6.2" /><path d="M8 4.6V8l2.4 1.6" /></svg>;
const GLOBE = <svg {...svgProps}><circle cx="8" cy="8" r="6.2" /><path d="M1.8 8h12.4M8 1.8c-3.2 3.4-3.2 9 0 12.4M8 1.8c3.2 3.4 3.2 9 0 12.4" /></svg>;

const WINDOW_PATHS = <><rect x="1.8" y="2.5" width="12.4" height="11" rx="1.5" /><path d="M1.8 5.8h12.4" /></>;
const DRAWN : Partial<Record<StatsIcon | "url", React.ReactElement>> = {
	active: CLOCK,
	url: GLOBE,
	sites: GLOBE,
	zoom: <svg {...svgProps}><circle cx="7" cy="7" r="4.8" /><path d="M10.5 10.5L14 14M5 7h4M7 5v4" /></svg>,
	tabs: <svg {...svgProps}><rect x="1.8" y="5.3" width="10" height="8.4" rx="1.4" /><path d="M4.6 2.6h8.2c.8 0 1.4.6 1.4 1.4v6.6" /></svg>,
	used: <svg {...svgProps}><path d="M4 1.8h8M4 14.2h8M5 1.8C5 5.6 11 6 11 8s-6 2.4-6 6.2M11 1.8C11 5.6 5 6 5 8s6 2.4 6 6.2" /></svg>,
	window: <svg {...svgProps}>{WINDOW_PATHS}</svg>,
	monitor: <svg {...svgProps}><rect x="1.5" y="2.3" width="13" height="8.7" rx="1.3" /><path d="M8 11v2.7M5.2 13.7h5.6" /></svg>,
	// a bookmark ribbon: saved
	saved: <svg {...svgProps}><path d="M4 1.8h8v12.4l-4-3.1-4 3.1z" /></svg>,
	hint: <svg {...svgProps}><circle cx="8" cy="8" r="6.2" /><path d="M8 7.4v3.6M8 4.9v.1" /></svg>,
};
// the window card's title icon, in the favicon's 16px spot
const WINDOW_HEAD = <span className="stats-favicon stats-head-icon" aria-hidden="true"><svg {...svgProps} width={16} height={16}>{WINDOW_PATHS}</svg></span>;

const Icon = ({name} : {name : StatsIcon | "url"}) => (
	<span className={"stats-icon stats-icon-" + name} aria-hidden="true">
		{DRAWN[name] || null}
	</span>
);

// the monitors (outlines), the other windows (faint) and this window (filled);
// a minimized window dashed, at the bounds it will be restored to;
// half a pixel in so the 1px strokes land on whole pixels
const Box = ({r, className} : {r : MapRect, className : string}) => (
	<rect className={className + (r.minimized ? " minimized" : "")} x={r.x + 0.5} y={r.y + 0.5} width={Math.max(r.w - 1, 1)} height={Math.max(r.h - 1, 1)} rx={1.5} />
);
const MapSvg = ({map} : {map : MonitorMap}) => (
	<svg className="stats-map" width={map.width} height={map.height} viewBox={"0 0 " + map.width + " " + map.height} aria-hidden="true">
		{map.monitors.map((r, i) => <Box key={"m" + i} r={r} className="stats-map-monitor" />)}
		{map.others.map((r, i) => <Box key={"o" + i} r={r} className="stats-map-other" />)}
		{map.target && <Box r={map.target} className="stats-map-window" />}
	</svg>
);

// the tile's tone class (css/components/tab.css), so a white icon stays visible;
// no favicon: the icon set's page icon, the tile's fallback (css/components/icons.css)
const Favicon = ({icon} : {icon : IStatsFavicon}) => icon.src
	? <img className={"stats-favicon icon-" + icon.tone} src={icon.src} alt="" />
	: <span className="stats-favicon stats-favicon-generic" aria-hidden="true" />;

function Line({line} : {line : StatsLine}) {
	if (line.items) {
		// word groups, each with its own icon; the first one's icon (if any)
		// sits in the icon column, else the column stays empty
		const lead = line.items[0].icon ? null : <span className="stats-icon stats-lead" aria-hidden="true" />;
		return (
			<div className={"stats-card-line stats-items stats-line-" + line.key}>
				{lead}
				{line.items.map((item, i) => (
					<React.Fragment key={i}>
						{i > 0 && <span className="stats-sep">·</span>}
						<span className={"stats-part" + (i === 0 ? " first" : "")}>
							{item.icon && <Icon name={item.icon} />}
							{item.text}
						</span>
					</React.Fragment>
				))}
			</div>
		);
	}
	return (
		<div className={"stats-card-line stats-line-" + line.key}>
			{line.icon ? <Icon name={line.icon} /> : <span className="stats-icon" aria-hidden="true" />}
			<span className="stats-text">{line.text}</span>
		</div>
	);
}

// The hover card for a tab or a window (text: ../stats.ts). Mounted once,
// with the popup, and never unmounted: hidden it is parked off screen
// (visibility: hidden, no pointer events, in its own contained layer, see
// StatsLayer, which is display: none meanwhile). Showing = render the new
// content (this subtree only) and switch it visible; moving = a transform written on the element straight
// from the mousemove handler (follow(): no React render, no layout, no frame
// of delay); hiding = the class and the transform, on the DOM (no render).
// Fixed to the viewport: it opens next to the pointer and follows it
// (placeAtPointer: flips left / above when there is no room), or, for the
// keyboard, sits next to the selected row (placeCard). It takes no pointer
// events: the tiles underneath keep their hover and clicks, and the pointer
// reaching the next tile starts its card.
export class StatsCard extends React.Component<IStatsCardProps> {
	private readonly ref : React.RefObject<HTMLDivElement> = React.createRef();
	// the pointer the card is placed at (null: next to props.anchor)
	private at : { x : number, y : number } | null = null;
	// measured once per content change, so following the pointer never
	// reads layout
	private size = { width: 0, height: 0 };
	private view = { width: 0, height: 0 };
	// on screen (the DOM state, set by show / hide)
	private visible = false;

	componentDidMount() {
		const el = this.ref.current;
		if (el) el.style.transform = PARKED;
		this.sync(null);
	}

	componentDidUpdate(prev : IStatsCardProps) {
		this.sync(prev);
	}

	// after a render (new content, the zoom answered, the keyboard's row
	// moved): measure again and place before the browser paints, so it never
	// shows at the old spot, then show
	private sync(prev : IStatsCardProps | null) {
		const {content, shown, pointer, anchor} = this.props;
		if (!shown || !content) {
			this.hide();
			return;
		}
		// a new opening point: from the keyboard's row to the pointer or back
		// (while shown, a card at the pointer keeps following the live pointer)
		if (!prev || !this.visible || prev.pointer !== pointer || prev.anchor !== anchor) {
			this.at = pointer ? (this.visible && this.at ? this.at : { ...pointer }) : null;
		}
		// the layer is display: none while no card is up (stats.css): in first
		if (!this.visible) this.ref.current?.parentElement?.classList.add("up");
		if (!prev || !this.visible || prev.content !== content || prev.anchor !== anchor) this.measure();
		this.place();
		if (!this.visible) {
			this.visible = true;
			// the fade (opacity only, css/motion.css) runs on opening; the
			// next tab's content then swaps in place without one
			this.ref.current?.classList.add("shown");
		}
	}

	// parked: no render, the class and the transform only
	hide() {
		const el = this.ref.current;
		this.at = null;
		if (!this.visible || !el) return;
		this.visible = false;
		el.classList.remove("shown");
		el.style.transform = PARKED;
		el.parentElement?.classList.remove("up");
	}

	measure() {
		const el = this.ref.current;
		if (!el) return;
		this.size = { width: el.offsetWidth, height: el.offsetHeight };
		this.view = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
	}

	// the pointer moved: follow it right away, in the same event, straight on
	// the DOM (a transform: no layout, no re-render, no frame of delay)
	follow(x : number, y : number) {
		if (!this.at || !this.visible) return;
		this.at.x = x;
		this.at.y = y;
		this.place();
	}

	place() {
		const el = this.ref.current;
		if (!el) return;
		const pos = this.at ? placeAtPointer(this.at.x, this.at.y, this.size, this.view) : this.props.anchor ? placeCard(this.props.anchor, this.size, this.view) : { left: 0, top: 0 };
		el.style.transform = "translate3d(" + pos.left + "px, " + pos.top + "px, 0)";
	}

	render() {
		const c = this.props.content;
		// "shown" is switched on the element by sync() / hide(); rendered here
		// too, so a className React rewrites (with-icon changed) keeps it
		// a window card (no url) has a window drawing where a tab has its favicon
		const isWindow = !!c && c.url === undefined;
		const cls = "stats-card" + (c && (c.icon || isWindow) ? " with-icon" : "") + (this.visible ? " shown" : "");
		if (!c) return <div className={cls} role="tooltip" aria-hidden="true" ref={this.ref} />;
		const {card, icon, url, sites, map} = c;
		const parts = url !== undefined ? splitUrl(url) : null;
		return (
			<div className={cls} role="tooltip" ref={this.ref}>
				<div className="stats-card-head">
					{icon ? <Favicon icon={icon} /> : isWindow ? WINDOW_HEAD : null}
					<div className="stats-card-title">{card.title}</div>
					{sites && sites.length > 0 && (
						<div className="stats-site-icons">
							{sites.map((site, i) => <Favicon key={i} icon={site} />)}
						</div>
					)}
				</div>
				{parts && (parts.host || parts.after) && (
					<div className="stats-card-url">
						<Icon name="url" />
						<span className="stats-text">
							<span className="stats-url-rest">{parts.before}</span>
							<span className="stats-url-host">{parts.host}</span>
							<span className="stats-url-rest">{parts.after}</span>
						</span>
					</div>
				)}
				{card.lines.map((line) => <Line key={line.key} line={line} />)}
				{map && <MapSvg map={map} />}
			</div>
		);
	}
}
