// Types
export type {
	SelectedMention,
	MentionConfig,
	UseContentEditableOptions,
	UseContentEditableReturn,
	CaretCoordinates,
} from "./types";

export { DEFAULT_MENTION_CONFIG } from "./types";

// Utilities
export { MentionDOM, normalizeValue, flattenOptions, escapeRegex, iconToHTML } from "./mentionDOM";
export { SelectionUtils } from "./selectionUtils";

