export * from "./components";
export type { MentionOption, MentionItemType } from "./hooks/useMentions";
export type { SelectedMention } from "./hooks/useContentEditable";

// Theme exports for customization
export type { PromptTheme, PresetThemeName } from "./types/theme";
export { themeToStyles, presetThemes } from "./types/theme";