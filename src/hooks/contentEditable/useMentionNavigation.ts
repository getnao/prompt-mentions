import { useCallback, useRef } from "react";
import { MentionDOM } from "./mentionDOM";
import { SelectionUtils } from "./selectionUtils";
import {
	isMentionInSelection,
	getSelectionDirection,
	moveRangeBoundary,
} from "./navigationUtils";

export interface UseMentionNavigationOptions {
	getElement: () => HTMLDivElement | null;
}

export interface UseMentionNavigationReturn {
	handleAtomicMentionNavigation: (e: React.KeyboardEvent<HTMLDivElement>) => boolean;
	updateMentionSelectionVisuals: () => void;
	resetSelectionDirection: () => void;
}

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

