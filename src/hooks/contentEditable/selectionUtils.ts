import { MentionDOM } from "./mentionDOM";
import type { CaretCoordinates } from "./types";

// ============================================================================
// Selection Utilities
// ============================================================================

export const SelectionUtils = {
	get(): Selection | null {
		return window.getSelection();
	},

	getRange(): Range | null {
		const sel = this.get();
		return sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
	},

	getCursorPosition(container: HTMLElement): number {
		const range = this.getRange();
		if (!range) return 0;

		const preCaretRange = range.cloneRange();
		preCaretRange.selectNodeContents(container);
		preCaretRange.setEnd(range.endContainer, range.endOffset);
		return preCaretRange.toString().length;
	},

	setCursorPosition(container: HTMLElement, position: number): void {
		const sel = this.get();
		if (!sel) return;

		const range = document.createRange();
		let currentPos = 0;
		let found = false;

		const walk = (node: Node): boolean => {
			if (node.nodeType === Node.TEXT_NODE) {
				const len = node.textContent?.length ?? 0;
				if (currentPos + len >= position) {
					range.setStart(node, position - currentPos);
					range.collapse(true);
					found = true;
					return true;
				}
				currentPos += len;
			} else if (MentionDOM.isMentionElement(node)) {
				const len = node.textContent?.length ?? 0;
				if (currentPos + len >= position) {
					range.setStartAfter(node);
					range.collapse(true);
					found = true;
					return true;
				}
				currentPos += len;
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				for (const child of Array.from(node.childNodes)) {
					if (walk(child)) return true;
				}
			}
			return false;
		};

		walk(container);

		if (!found) {
			range.selectNodeContents(container);
			range.collapse(false);
		}

		sel.removeAllRanges();
		sel.addRange(range);
	},

	getCaretCoordinates(container: HTMLElement): CaretCoordinates {
		const range = this.getRange();
		if (!range) return { top: 0, left: 0, bottom: 0, height: 0 };

		const rect = range.getBoundingClientRect();

		if (rect.width === 0 && rect.height === 0) {
			const containerRect = container.getBoundingClientRect();
			// Fallback to container position with estimated line height
			const height = 20;
			return {
				top: containerRect.top,
				left: containerRect.left,
				bottom: containerRect.top + height,
				height,
			};
		}

		return {
			top: rect.top,
			left: rect.left,
			bottom: rect.bottom,
			height: rect.height,
		};
	},

	setAfter(sel: Selection, node: Node, offset = 1): void {
		const range = document.createRange();
		range.setStart(node, offset);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	},
};

