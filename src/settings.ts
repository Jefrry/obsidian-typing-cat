import { PluginSettingTab, App, Setting } from "obsidian";
import TypingCatImagePlugin from "./main";

export interface TypingCatSettings {
	widthPx: number;
	marginLeftPx: number;
	marginBottomPx: number;
	opacity: number;
	clickable: boolean;
}

export const DEFAULT_SETTINGS: TypingCatSettings = {
	widthPx: 160,
	marginLeftPx: 12,
	marginBottomPx: 12,
	opacity: 1,
	clickable: false,
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

		containerEl.createEl("h2", { text: "Corner Overlay Image" });

		new Setting(containerEl)
			.setName("Ширина (px)")
			.addText((s) =>
				s
					.setValue(this.plugin.settings.widthPx.toString())
					.onChange(async (v) => {
						const num = Number(v);
						if (!isNaN(num)) {
							this.plugin.settings.widthPx = num;
							await this.plugin.saveSettings();
						}
					})
			);
		new Setting(containerEl)
			.setName("Отступ слева (px)")
			.addText((s) =>
				s
					.setValue(this.plugin.settings.marginLeftPx.toString())
					.onChange(async (v) => {
						const num = Number(v);
						if (!isNaN(num)) {
							this.plugin.settings.marginLeftPx = num;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Отступ снизу (px)")
			.addText((s) =>
				s
					.setValue(this.plugin.settings.marginBottomPx.toString())
					.onChange(async (v) => {
						const num = Number(v);
						if (!isNaN(num)) {
							this.plugin.settings.marginBottomPx = num;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Прозрачность")
			.setDesc("0 — полностью прозрачная, 1 — полностью видимая")
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
			.setName("Кликабельная")
			.setDesc("Если выключено — клики проходят “сквозь” картинку.")
			.addToggle((t) =>
				t.setValue(this.plugin.settings.clickable).onChange(async (v) => {
					this.plugin.settings.clickable = v;
					await this.plugin.saveSettings();
				})
			);
	}
}
