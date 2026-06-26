export type ToolLink = {
	title: string;
	description: string;
	url: string;
	icon: string;
	external?: boolean;
};

export const tools: ToolLink[] = [
	{
		title: "MusicLab",
		description: "查看独立产品推广页示例",
		url: "https://musiclab.pages.dev/zh",
		icon: "material-symbols:music-note-rounded",
		external: true,
	},
	{
		title: "开源仓库",
		description: "浏览 Graycen 的 GitHub 项目",
		url: "https://github.com/ayxworxfr",
		icon: "fa6-brands:github",
		external: true,
	},
	{
		title: "RSS",
		description: "订阅博客更新",
		url: "/rss.xml",
		icon: "material-symbols:rss-feed-rounded",
	},
];
