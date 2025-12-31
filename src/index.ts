export * from "./components";
export type { MentionOption, MentionItemType } from "./hooks/useMentions";
export type { SelectedMention } from "./hooks/useContentEditable";

// Theme exports for customization
export type { PromptTheme, PresetThemeName } from "./types/theme";
export { themeToStyles, presetThemes, defaultTheme } from "./types/theme";

// Extension icons utilities for customization
export {
	getExtensionIcon,
	extensionIconMap,
	filenameIconMap,
	DefaultFileIcon,
	DefaultFolderIcon,
} from "./utils/extensionIcons";