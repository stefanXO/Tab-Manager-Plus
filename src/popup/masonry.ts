// Packs the block layouts: the window grid uses small fixed rows, and every card
// spans as many as its rendered height needs, so the next card can start right
// under a short one instead of at the tallest card of the row. Placement stays
// row-major (no `dense`), so the windowAge order is never disturbed.

import {perfSpan} from "./perfSpan";

const ROW = 8;   // px, must match grid-auto-rows in popup.css
const GAP = 8;   // px, must match --card-gap in popup.css

// Writes are batched into the next frame and skipped when nothing changed:
// setting a span inside the observer callback would re-trigger observations in
// the same cycle ("ResizeObserver loop completed with undelivered notifications").
const pending = new Set<HTMLElement>();
let frame = 0;

// All reads, then all writes: a write invalidates the layout, so reading the
// next card's height after it would force a full layout per card (with 20
// windows and 150 tabs that was ~20 layouts, half a second, per layout switch).
function measure(cards : Iterable<HTMLElement>) {
	const list = Array.from(cards);
	// offsetHeight ignores transforms, so the entrance animation's
	// scale does not make the row span jitter while it plays
	const heights = list.map((el) => el.offsetHeight);
	list.forEach((el, i) => {
		const value = "span " + Math.max(1, Math.ceil((heights[i] + GAP) / (ROW + GAP)));
		if (el.style.gridRowEnd !== value) el.style.gridRowEnd = value;
	});
}

function span(card : HTMLElement) {
	pending.add(card);
	if (frame) return;
	frame = requestAnimationFrame(() => {
		frame = 0;
		perfSpan("masonry", () => measure(pending));
		pending.clear();
	});
}

export interface Masonry {
	disconnect() : void
}

// Observes the container: new cards get measured as they appear, and every card
// is re-measured when its size changes (tabs added, title wrapped, layout switch).
export function attachMasonry(container : HTMLElement) : Masonry {
	const sizes = new ResizeObserver((entries) => {
		for (const entry of entries) span(entry.target as HTMLElement);
	});
	const watch = (el : Node) => {
		// cards and the full-width section dividers ("Minimized windows", sessions)
		if (el instanceof HTMLElement && (el.classList.contains("window") || el.classList.contains("hrCont"))) sizes.observe(el);
	};
	// the cards already there are measured right away, not in the next frame:
	// attach runs from componentDidUpdate, before the browser paints, so a
	// layout switch shows the packed grid in its first frame
	const cards : HTMLElement[] = [];
	for (const el of Array.from(container.children)) {
		watch(el);
		if (el instanceof HTMLElement && el.classList.contains("window")) cards.push(el);
	}
	measure(cards);
	const children = new MutationObserver((records) => {
		for (const r of records) {
			r.addedNodes.forEach(watch);
			r.removedNodes.forEach((n) => { if (n instanceof HTMLElement) sizes.unobserve(n); });
		}
	});
	children.observe(container, { childList: true });
	return {
		disconnect() {
			children.disconnect();
			sizes.disconnect();
		}
	};
}
