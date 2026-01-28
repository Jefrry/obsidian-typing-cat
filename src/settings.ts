import { PluginSettingTab, App, Setting } from "obsidian";
import TypingCatImagePlugin from "./main";

export enum SpeedMetric {
	WPM = "wpm",
	CPM = "cpm",
	CPS = "cps",
}

export interface TypingCatSettings {
	widthPercent: number;
	leftPercent: number;
	bottomPercent: number;
	opacity: number;
	clickable: boolean;
	mirror: boolean;
	showSpeed: boolean;
	speedMetric: SpeedMetric;
}

export const DEFAULT_SETTINGS: TypingCatSettings = {
	widthPercent: 10,
	leftPercent: 2,
	bottomPercent: 2,
	opacity: 1,
	clickable: false,
	mirror: false,
	showSpeed: true,
	speedMetric: SpeedMetric.WPM,
};

export class TypingCatSettingTab extends PluginSettingTab {
	plugin: TypingCatImagePlugin;

	constructor(app: App, plugin: TypingCatImagePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("Corner overlay image").setHeading();

		new Setting(containerEl)
			.setName("Width (%)")
			.setDesc("Width as a percentage of the window width")
			.addSlider((s) =>
				s
					.setLimits(1, 100, 1)
					.setValue(this.plugin.settings.widthPercent)
					.setDynamicTooltip()
					.onChange(async (v) => {
						this.plugin.settings.widthPercent = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Left position (%)")
			.setDesc("Distance from the left edge as a percentage")
			.addSlider((s) =>
				s
					.setLimits(0, 100, 1)
					.setValue(this.plugin.settings.leftPercent)
					.setDynamicTooltip()
					.onChange(async (v) => {
						this.plugin.settings.leftPercent = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Bottom position (%)")
			.setDesc("Distance from the bottom edge as a percentage")
			.addSlider((s) =>
				s
					.setLimits(0, 100, 1)
					.setValue(this.plugin.settings.bottomPercent)
					.setDynamicTooltip()
					.onChange(async (v) => {
						this.plugin.settings.bottomPercent = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Opacity")
			.setDesc("0 — fully transparent, 1 — fully visible")
			.addSlider((s) =>
				s
					.setLimits(0, 1, 0.05)
					.setValue(this.plugin.settings.opacity)
					.setDynamicTooltip()
					.onChange(async (v) => {
						this.plugin.settings.opacity = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Clickable")
			.setDesc("If off, clicks pass through the image.")
			.addToggle((t) =>
				t.setValue(this.plugin.settings.clickable).onChange(async (v) => {
					this.plugin.settings.clickable = v;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Mirror cat")
			.setDesc("Flip the image horizontally.")
			.addToggle((t) =>
				t.setValue(this.plugin.settings.mirror).onChange(async (v) => {
					this.plugin.settings.mirror = v;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl).setName("Typing Speed").setHeading();

		new Setting(containerEl)
			.setName("Show speed")
			.setDesc("Show typing speed counter.")
			.addToggle((t) =>
				t.setValue(this.plugin.settings.showSpeed).onChange(async (v) => {
					this.plugin.settings.showSpeed = v;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Typing speed metric")
			.setDesc("Choose which metric to use for typing speed.")
			.addDropdown((d) =>
				d
					.addOption(SpeedMetric.WPM, "Words per minute")
					.addOption(SpeedMetric.CPS, "Characters per second")
					.addOption(SpeedMetric.CPM, "Characters per minute")
					.setValue(this.plugin.settings.speedMetric)
					.onChange(async (v) => {
						this.plugin.settings.speedMetric = v as SpeedMetric;
						await this.plugin.saveSettings();
					})
			);
	}
}
