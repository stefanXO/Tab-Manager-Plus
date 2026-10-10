"use strict";

// Which side of an open tab a drag over it is on, for the drop marker and the
// place the drop goes (Tab.tsx, Window.tsx): the first half of the tab (its
// left, in List its top) is before it. `offset*` are the pointer's offsets in
// the tab, `width` / `height` the tab's size. The tab and the window around
// it ask the same function, so the marker and the verdict on the drop agree.
export function tabDropBefore(list : boolean, offsetX : number, offsetY : number, width : number, height : number) : boolean {
	return list ? !(offsetY > height / 2) : !(offsetX > width / 2);
}
