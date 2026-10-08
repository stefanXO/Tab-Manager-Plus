"use strict";

// Where each open tab of a drop goes, as the `index` to hand to tabs.move
// (unit tested in tests/openMovePlan.test.ts).
//
// The drop marker sits in a gap between two tabs of the target window, the
// gap before the tab at `index` (as it is now, the dragged tabs still in
// it). tabs.move takes the index the tab ends up at, counted after the tab
// has been taken out of its window. A tab that sits before the gap in that
// same window therefore leaves the gap one place further left once it is
// lifted, and handing the marker's index over unchanged lands it one tab too
// far right. So the tabs are not moved to the gap's number but each right
// before the first tab of the window that stays put at or after the gap (the
// anchor), in the order they were dragged: the same place whichever window
// they come from and however many are before the gap.

export interface MovingTab {
	id : number;
}

// The moves that put `moving` into the window whose tabs are now `order` (ids,
// left to right) at the gap before `index`, to do one after the other.
// Dropped on their own place, they come out where they were.
export function openMoveIndices(order : readonly number[], moving : readonly MovingTab[], index : number) : { id : number, index : number }[] {
	const going = new Set(moving.map((tab) => tab.id));
	const list = order.slice();
	let anchor : number | undefined;
	for (let i = Math.max(0, index); i < list.length; i++) {
		if (!going.has(list[i])) {
			anchor = list[i];
			break;
		}
	}
	const moves : { id : number, index : number }[] = [];
	for (const tab of moving) {
		const at = list.indexOf(tab.id);
		if (at >= 0) list.splice(at, 1);
		const to = anchor === undefined ? list.length : list.indexOf(anchor);
		list.splice(to, 0, tab.id);
		moves.push({ id: tab.id, index: to });
	}
	return moves;
}
