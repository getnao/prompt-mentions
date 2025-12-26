/**
 * Utilities for handling selection and navigation around mention elements.
 */

/**
 * Check if a mention element is fully contained within a selection range.
 */
export function isMentionInSelection(mention: HTMLElement, range: Range): boolean {
	const mentionRange = document.createRange();
	mentionRange.selectNode(mention);
	const startComparison = range.compareBoundaryPoints(Range.START_TO_START, mentionRange);
	const endComparison = range.compareBoundaryPoints(Range.END_TO_END, mentionRange);
	return startComparison <= 0 && endComparison >= 0;
}

/**
 * Determine the direction of the current selection (left or right).
 */
export function getSelectionDirection(
	sel: Selection,
	directionRef: React.MutableRefObject<"left" | "right" | null>
): "left" | "right" {
	if (directionRef.current) {
		return directionRef.current;
	}
	if (!sel.anchorNode || !sel.focusNode) return "right";
	if (sel.anchorNode === sel.focusNode) {
		return sel.focusOffset < sel.anchorOffset ? "left" : "right";
	}
	const position = sel.anchorNode.compareDocumentPosition(sel.focusNode);
	if (position & Node.DOCUMENT_POSITION_PRECEDING) return "left";
	if (position & Node.DOCUMENT_POSITION_FOLLOWING) return "right";
	return "right";
}

/**
 * Move a range boundary by one character in the specified direction.
 * Returns null if the boundary cannot be moved.
 */
export function moveRangeBoundary(
	range: Range,
	boundary: "start" | "end",
	moveDirection: "left" | "right"
): Range | null {
	const newRange = range.cloneRange();

	if (boundary === "start") {
		return moveStartBoundary(newRange, range, moveDirection);
	} else {
		return moveEndBoundary(newRange, range, moveDirection);
	}
}

function moveStartBoundary(
	newRange: Range,
	range: Range,
	moveDirection: "left" | "right"
): Range | null {
	const node = range.startContainer;
	const offset = range.startOffset;

	if (moveDirection === "left") {
		if (node.nodeType === Node.TEXT_NODE && offset > 0) {
			newRange.setStart(node, offset - 1);
		} else if (node.nodeType === Node.TEXT_NODE && offset === 0) {
			const prev = node.previousSibling;
			if (prev && prev.nodeType === Node.TEXT_NODE) {
				const prevLen = prev.textContent?.length ?? 0;
				newRange.setStart(prev, Math.max(0, prevLen - 1));
			} else if (prev) {
				newRange.setStartBefore(prev);
			} else {
				return null;
			}
		} else if (node.nodeType === Node.ELEMENT_NODE && offset > 0) {
			const child = node.childNodes[offset - 1];
			if (child && child.nodeType === Node.TEXT_NODE) {
				const childLen = child.textContent?.length ?? 0;
				newRange.setStart(child, Math.max(0, childLen - 1));
			} else if (child) {
				newRange.setStartBefore(child);
			} else {
				return null;
			}
		} else {
			return null;
		}
	} else {
		if (node.nodeType === Node.TEXT_NODE) {
			const textLen = node.textContent?.length ?? 0;
			if (offset < textLen) {
				newRange.setStart(node, offset + 1);
			} else {
				const next = node.nextSibling;
				if (next && next.nodeType === Node.TEXT_NODE) {
					newRange.setStart(next, 1);
				} else if (next) {
					newRange.setStartAfter(next);
				} else {
					return null;
				}
			}
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const child = node.childNodes[offset];
			if (child && child.nodeType === Node.TEXT_NODE) {
				newRange.setStart(child, 1);
			} else if (child) {
				newRange.setStartAfter(child);
			} else {
				return null;
			}
		} else {
			return null;
		}
	}

	return newRange;
}

function moveEndBoundary(
	newRange: Range,
	range: Range,
	moveDirection: "left" | "right"
): Range | null {
	const node = range.endContainer;
	const offset = range.endOffset;

	if (moveDirection === "right") {
		if (node.nodeType === Node.TEXT_NODE) {
			const textLen = node.textContent?.length ?? 0;
			if (offset < textLen) {
				newRange.setEnd(node, offset + 1);
			} else {
				const next = node.nextSibling;
				if (next && next.nodeType === Node.TEXT_NODE) {
					newRange.setEnd(next, 1);
				} else if (next) {
					newRange.setEndAfter(next);
				} else {
					return null;
				}
			}
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const child = node.childNodes[offset];
			if (child && child.nodeType === Node.TEXT_NODE) {
				newRange.setEnd(child, 1);
			} else if (child) {
				newRange.setEndAfter(child);
			} else {
				return null;
			}
		} else {
			return null;
		}
	} else {
		if (node.nodeType === Node.TEXT_NODE && offset > 0) {
			newRange.setEnd(node, offset - 1);
		} else if (node.nodeType === Node.TEXT_NODE && offset === 0) {
			const prev = node.previousSibling;
			if (prev && prev.nodeType === Node.TEXT_NODE) {
				const prevLen = prev.textContent?.length ?? 0;
				newRange.setEnd(prev, prevLen > 0 ? prevLen - 1 : 0);
			} else if (prev) {
				newRange.setEndBefore(prev);
			} else {
				return null;
			}
		} else if (node.nodeType === Node.ELEMENT_NODE && offset > 0) {
			const child = node.childNodes[offset - 1];
			if (child && child.nodeType === Node.TEXT_NODE) {
				const childLen = child.textContent?.length ?? 0;
				newRange.setEnd(child, childLen > 0 ? childLen - 1 : 0);
			} else if (child) {
				newRange.setEndBefore(child);
			} else {
				return null;
			}
		} else {
			return null;
		}
	}

	return newRange;
}

