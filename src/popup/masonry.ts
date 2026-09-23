// Packs the block layouts: the window grid uses small fixed rows, and every card
// spans as many as its rendered height needs, so the next card can start right
// under a short one instead of at the tallest card of the row. Placement stays
// row-major (no `dense`), so the windowAge order is never disturbed.

const ROW = 8;   // px, must match grid-auto-rows in popup.css
const GAP = 8;   // px, must match --card-gap in popup.css

function span(card : HTMLElement) {
	const height = card.getBoundingClientRect().height;
	card.style.gridRowEnd = "span " + Math.max(1, Math.ceil((height + GAP) / (ROW + GAP)));
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
	for (const el of Array.from(container.children)) watch(el);
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
