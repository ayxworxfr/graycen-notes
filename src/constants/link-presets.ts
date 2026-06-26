import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { LinkPreset, type NavBarLink } from "@/types/config";

export const LinkPresets: { [key in LinkPreset]: NavBarLink } = {
	[LinkPreset.Home]: {
		name: i18n(I18nKey.home),
		url: "/",
		icon: "material-symbols:home-outline-rounded",
	},
	[LinkPreset.About]: {
		name: i18n(I18nKey.about),
		url: "/about/",
		icon: "material-symbols:person-outline-rounded",
	},
	[LinkPreset.Archive]: {
		name: i18n(I18nKey.archive),
		url: "/archive/",
		icon: "material-symbols:archive-outline-rounded",
	},
	[LinkPreset.Friends]: {
		name: i18n(I18nKey.friends),
		url: "/friends/",
		icon: "material-symbols:group-outline-rounded",
	},
	[LinkPreset.Tools]: {
		name: i18n(I18nKey.tools),
		url: "/tools/",
		icon: "material-symbols:build-outline-rounded",
	},
};
