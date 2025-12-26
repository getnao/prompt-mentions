import { useCallback } from "react";
import type { MentionConfig } from "./types";
import { MentionDOM } from "./mentionDOM";
import { SelectionUtils } from "./selectionUtils";

export interface UseClipboardHandlersOptions {
	getElement: () => HTMLDivElement | null;
	triggers: string[];
	mentionConfigs: MentionConfig[];
	onContentChanged: () => void;
}

export interface UseClipboardHandlersReturn {
	onCopy: (e: React.ClipboardEvent<HTMLDivElement>) => void;
	onCut: (e: React.ClipboardEvent<HTMLDivElement>) => void;
	onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
}

export function useClipboardHandlers({
	getElement,
	triggers,
	mentionConfigs,
	onContentChanged,
}: UseClipboardHandlersOptions): UseClipboardHandlersReturn {
	const getSelectedSerializedContent = useCallback((): { text: string; html: string } => {
		const sel = SelectionUtils.get();
		if (!sel || sel.rangeCount === 0) {
			return { text: "", html: "" };
		}

		const range = sel.getRangeAt(0);
		if (range.collapsed) {
			return { text: "", html: "" };
		}

		const fragment = range.cloneContents();
		const tempDiv = document.createElement("div");
		tempDiv.appendChild(fragment);

		const serializedText = MentionDOM.extractValueMulti(tempDiv, triggers);
		const html = tempDiv.innerHTML;

		return { text: serializedText, html };
	}, [triggers]);

	const onCopy = useCallback(
		(e: React.ClipboardEvent<HTMLDivElement>) => {
			const { text, html } = getSelectedSerializedContent();

			if (text || html) {
				e.preventDefault();
				e.clipboardData.setData("text/plain", text);
				e.clipboardData.setData("text/html", html);
			}
		},
		[getSelectedSerializedContent]
	);

	const onCut = useCallback(
		(e: React.ClipboardEvent<HTMLDivElement>) => {
			const el = getElement();
			const sel = SelectionUtils.get();
			if (!el || !sel) return;

			const { text, html } = getSelectedSerializedContent();

			if (text || html) {
				e.preventDefault();
				e.clipboardData.setData("text/plain", text);
				e.clipboardData.setData("text/html", html);

				const range = sel.getRangeAt(0);
				range.deleteContents();

				onContentChanged();
			}
		},
		[getElement, getSelectedSerializedContent, onContentChanged]
	);

	const onPaste = useCallback(
		(e: React.ClipboardEvent<HTMLDivElement>) => {
			e.preventDefault();

			const el = getElement();
			const sel = SelectionUtils.get();
			if (!el || !sel || sel.rangeCount === 0) return;

			const pastedText = e.clipboardData.getData("text/plain");
			if (!pastedText) return;

			const range = sel.getRangeAt(0);

			if (!range.collapsed) {
				range.deleteContents();
			}

			const parsedHTML = MentionDOM.parseValueMulti(pastedText, mentionConfigs);

			const tempDiv = document.createElement("div");
			tempDiv.innerHTML = parsedHTML;

			const nodesToInsert = Array.from(tempDiv.childNodes);
			let lastInsertedNode: Node | null = null;

			nodesToInsert.forEach((node) => {
				const insertedNode = node.cloneNode(true);
				range.insertNode(insertedNode);
				range.setStartAfter(insertedNode);
				range.collapse(true);
				lastInsertedNode = insertedNode;
			});

			if (lastInsertedNode) {
				range.setStartAfter(lastInsertedNode);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			}

			onContentChanged();
		},
		[getElement, mentionConfigs, onContentChanged]
	);

	return { onCopy, onCut, onPaste };
}

