import { useCallback, useRef } from "react";
import { MentionDOM } from "./mentionDOM";
import { SelectionUtils } from "./selectionUtils";

// ============================================================================
// Types
// ============================================================================

export interface UseMentionNavigationOptions {
	getElement: () => HTMLDivElement | null;
}

export interface UseMentionNavigationReturn {
	handleAtomicMentionNavigation: (e: React.KeyboardEvent<HTMLDivElement>) => boolean;
	updateMentionSelectionVisuals: () => void;
	resetSelectionDirection: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const isMentionInSelection = (mention: HTMLElement, range: Range): boolean => {
	const mentionRange = document.createRange();
	mentionRange.selectNode(mention);
	const startComparison = range.compareBoundaryPoints(Range.START_TO_START, mentionRange);
	const endComparison = range.compareBoundaryPoints(Range.END_TO_END, mentionRange);
	return startComparison <= 0 && endComparison >= 0;
};

const getSelectionDirection = (
	sel: Selection,
	directionRef: React.MutableRefObject<"left" | "right" | null>
): "left" | "right" => {
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
};

const moveRangeBoundary = (
	range: Range,
	boundary: "start" | "end",
	moveDirection: "left" | "right"
): Range | null => {
	const newRange = range.cloneRange();

	if (boundary === "start") {
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
	} else {
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
	}

	return newRange;
};

// ============================================================================
// Hook
// ============================================================================

export function useMentionNavigation({
	getElement,
}: UseMentionNavigationOptions): UseMentionNavigationReturn {
	const selectionDirectionRef = useRef<"left" | "right" | null>(null);

	const resetSelectionDirection = useCallback(() => {
		selectionDirectionRef.current = null;
	}, []);

	const modifySelectionByOneChar = useCallback(
		(sel: Selection, range: Range, arrowDirection: "left" | "right"): boolean => {
			const selDir = getSelectionDirection(sel, selectionDirectionRef);

			if (!selectionDirectionRef.current) {
				selectionDirectionRef.current = selDir;
			}

			const boundary: "start" | "end" = selDir === "left" ? "start" : "end";
			const newRange = moveRangeBoundary(range, boundary, arrowDirection);
			if (!newRange) return false;

			if (newRange.collapsed) {
				selectionDirectionRef.current = null;
				sel.removeAllRanges();
				sel.addRange(newRange);
				return true;
			}

			sel.removeAllRanges();
			sel.addRange(newRange);
			return true;
		},
		[]
	);

	const handleAtomicMentionNavigation = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>): boolean => {
			const el = getElement();
			if (!el) return false;

			if (e.altKey || e.metaKey || e.ctrlKey) return false;

			const sel = SelectionUtils.get();
			if (!sel || sel.rangeCount === 0) return false;

			const range = sel.getRangeAt(0);
			const isLeft = e.key === "ArrowLeft";
			const isRight = e.key === "ArrowRight";
			const isShift = e.shiftKey;

			if (!isLeft && !isRight) return false;

			let adjacentMention: HTMLElement | null = null;

			if (isLeft) {
				const node = range.startContainer;
				const offset = range.startOffset;

				if (node.nodeType === Node.TEXT_NODE && offset === 0) {
					const prev = node.previousSibling;
					if (prev && MentionDOM.isMentionElement(prev)) {
						adjacentMention = prev as HTMLElement;
					}
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					const child = node.childNodes[offset - 1];
					if (child && MentionDOM.isMentionElement(child)) {
						adjacentMention = child as HTMLElement;
					}
				}
			} else {
				const node = range.endContainer;
				const offset = range.endOffset;

				if (node.nodeType === Node.TEXT_NODE) {
					const textLen = node.textContent?.length ?? 0;
					if (offset === textLen) {
						const next = node.nextSibling;
						if (next && MentionDOM.isMentionElement(next)) {
							adjacentMention = next as HTMLElement;
						}
					}
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					const child = node.childNodes[offset];
					if (child && MentionDOM.isMentionElement(child)) {
						adjacentMention = child as HTMLElement;
					}
				}
			}

			if (adjacentMention) {
				if (!range.collapsed && isMentionInSelection(adjacentMention, range)) {
					e.preventDefault();
					if (isShift) {
						modifySelectionByOneChar(sel, range, isLeft ? "left" : "right");
					} else {
						selectionDirectionRef.current = null;
						const newRange = document.createRange();
						if (isLeft) {
							newRange.setStart(range.startContainer, range.startOffset);
						} else {
							newRange.setStart(range.endContainer, range.endOffset);
						}
						newRange.collapse(true);
						sel.removeAllRanges();
						sel.addRange(newRange);
					}
					return true;
				}

				e.preventDefault();

				const newRange = document.createRange();

				if (isShift) {
					if (range.collapsed) {
						selectionDirectionRef.current = isLeft ? "left" : "right";
					}
					if (isLeft) {
						newRange.setStartBefore(adjacentMention);
						newRange.setEnd(range.endContainer, range.endOffset);
					} else {
						newRange.setStart(range.startContainer, range.startOffset);
						newRange.setEndAfter(adjacentMention);
					}
				} else {
					selectionDirectionRef.current = null;
					if (isLeft) {
						newRange.setStartBefore(adjacentMention);
						newRange.collapse(true);
					} else {
						newRange.setStartAfter(adjacentMention);
						newRange.collapse(true);
					}
				}

				sel.removeAllRanges();
				sel.addRange(newRange);
				return true;
			}

			if (!range.collapsed) {
				const mentionElements = el.querySelectorAll("[data-mention]");
				for (const mention of Array.from(mentionElements)) {
					if (isMentionInSelection(mention as HTMLElement, range)) {
						e.preventDefault();
						if (isShift) {
							modifySelectionByOneChar(sel, range, isLeft ? "left" : "right");
						} else {
							selectionDirectionRef.current = null;
							const newRange = document.createRange();
							if (isLeft) {
								newRange.setStart(range.startContainer, range.startOffset);
							} else {
								newRange.setStart(range.endContainer, range.endOffset);
							}
							newRange.collapse(true);
							sel.removeAllRanges();
							sel.addRange(newRange);
						}
						return true;
					}
				}
			}

			return false;
		},
		[getElement, modifySelectionByOneChar]
	);

	const updateMentionSelectionVisuals = useCallback(() => {
		const el = getElement();
		if (!el) return;

		const sel = SelectionUtils.get();
		const mentionElements = el.querySelectorAll("[data-mention]");

		mentionElements.forEach((mention) => {
			mention.classList.remove("mention-selected");
		});

		if (!sel || sel.rangeCount === 0) return;
		const range = sel.getRangeAt(0);
		if (range.collapsed) return;

		mentionElements.forEach((mention) => {
			if (isMentionInSelection(mention as HTMLElement, range)) {
				mention.classList.add("mention-selected");
			}
		});
	}, [getElement]);

	return {
		handleAtomicMentionNavigation,
		updateMentionSelectionVisuals,
		resetSelectionDirection,
	};
}

