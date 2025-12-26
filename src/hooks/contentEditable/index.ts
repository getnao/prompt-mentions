// Types
export type {
	SelectedMention,
	MentionConfig,
	MentionRefs,
	UseContentEditableOptions,
	UseContentEditableReturn,
	CaretCoordinates,
} from "./types";

export { DEFAULT_MENTION_CONFIG } from "./types";

// Utilities
export { MentionDOM, normalizeValue, flattenOptions, escapeRegex, iconToHTML } from "./mentionDOM";
export { SelectionUtils } from "./selectionUtils";
export { isMentionInSelection, getSelectionDirection, moveRangeBoundary } from "./navigationUtils";

// Hooks
export { useMentionNavigation } from "./useMentionNavigation";
export type { UseMentionNavigationOptions, UseMentionNavigationReturn } from "./useMentionNavigation";

export { useMentionInsertion } from "./useMentionInsertion";
export type { UseMentionInsertionOptions, UseMentionInsertionReturn } from "./useMentionInsertion";

export { useMentionTrigger } from "./useMentionTrigger";
export type { UseMentionTriggerOptions, UseMentionTriggerReturn } from "./useMentionTrigger";

export { useClipboardHandlers } from "./useClipboardHandlers";
export type { UseClipboardHandlersOptions, UseClipboardHandlersReturn } from "./useClipboardHandlers";
