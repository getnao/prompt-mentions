import { useCallback } from "react";
import type { MentionOption } from "../useMentions";
import type { MentionConfig, MentionRefs } from "./types";
import { MentionDOM } from "./mentionDOM";
import { SelectionUtils } from "./selectionUtils";

export interface UseMentionInsertionOptions {
	getElement: () => HTMLDivElement | null;
	getValue: () => string;
	triggers: string[];
	mentionConfigs: MentionConfig[];
	mentionRefs: MentionRefs;
	onInserted: (newValue: string) => void;
	closeMenu: () => void;
	enterSubmenu: (option: MentionOption) => void;
}

export interface UseMentionInsertionReturn {
	insertMention: (option: MentionOption) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useMentionInsertion({
	getElement,
	getValue,
	triggers,
	mentionConfigs,
	mentionRefs,
	onInserted,
	closeMenu,
	enterSubmenu,
}: UseMentionInsertionOptions): UseMentionInsertionReturn {
	const insertMention = useCallback(
		(option: MentionOption) => {
			const el = getElement();
			const sel = SelectionUtils.get();
			if (!el || !sel || mentionRefs.mentionStart.current === null || !mentionRefs.activeTrigger.current) return;

			if (option.children && option.children.length > 0) {
				enterSubmenu(option);
				return;
			}

			const activeTrigger = mentionRefs.activeTrigger.current;
			const activeConfig = mentionConfigs.find(c => c.trigger === activeTrigger);
			const showTrigger = activeConfig?.showTrigger ?? false;

			const textCursorPos = SelectionUtils.getCursorPosition(el);
			const textStartPos = mentionRefs.mentionStart.current;
			const serialized = getValue();

			const serStartPos = MentionDOM.textPosToSerializedPosMulti(el, textStartPos, triggers);
			const serCursorPos = MentionDOM.textPosToSerializedPosMulti(el, textCursorPos, triggers);

			const before = serialized.slice(0, serStartPos);
			const after = serialized.slice(serCursorPos);
			const newValue = `${before}${activeTrigger}[${option.id}] ${after}`;

			const updatedConfigs = mentionConfigs.map(c =>
				c.trigger === activeTrigger
					? { ...c, options: [...c.options, option] }
					: c
			);
			el.innerHTML = MentionDOM.parseValueMulti(newValue, updatedConfigs);

			const iconOffset = option.icon ? 1 : 0;
			// If trigger is hidden, don't add its length to cursor position
			const triggerDisplayLen = showTrigger ? activeTrigger.length : 0;
			const newCursorPos = textStartPos + triggerDisplayLen + option.label.length + 1 + iconOffset;
			SelectionUtils.setCursorPosition(el, newCursorPos);

			mentionRefs.mentionStart.current = null;
			mentionRefs.mentionEnd.current = null;
			mentionRefs.activeTrigger.current = null;
			closeMenu();

			onInserted(newValue);
		},
		[getElement, getValue, triggers, mentionConfigs, mentionRefs, onInserted, closeMenu, enterSubmenu]
	);

	return { insertMention };
}

