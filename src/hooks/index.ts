export { useHistory } from "./useHistory";
export type { HistoryEntry, UseHistoryOptions, UseHistoryReturn } from "./useHistory";

export { useContentEditable } from "./useContentEditable";
export type { UseContentEditableOptions, UseContentEditableReturn, SelectedMention, MentionConfig } from "./useContentEditable";

export { useMentions } from "./useMentions";
export type { MentionOption, MentionItemType, MentionMenuState, UseMentionsOptions, UseMentionsReturn, CaretRect, MentionTriggerConfig } from "./useMentions";

// Sub-hooks for advanced usage
export { useMentionNavigation } from "./contentEditable/useMentionNavigation";
export type { UseMentionNavigationOptions, UseMentionNavigationReturn } from "./contentEditable/useMentionNavigation";

export { useMentionInsertion } from "./contentEditable/useMentionInsertion";
export type { UseMentionInsertionOptions, UseMentionInsertionReturn } from "./contentEditable/useMentionInsertion";
export type { MentionRefs } from "./contentEditable/types";

export { useMentionTrigger } from "./contentEditable/useMentionTrigger";
export type { UseMentionTriggerOptions, UseMentionTriggerReturn } from "./contentEditable/useMentionTrigger";

export { useClipboardHandlers } from "./contentEditable/useClipboardHandlers";
export type { UseClipboardHandlersOptions, UseClipboardHandlersReturn } from "./contentEditable/useClipboardHandlers";

