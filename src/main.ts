import {
	Plugin,
	TFile,
	normalizePath,
} from "obsidian";
import { catIdle } from "./images/cat-idle";
import { catLeft } from "./images/cat-left";
import { catRight } from "./images/cat-right";
import { DEFAULT_SETTINGS, TypingCatSettingTab, TypingCatSettings } from "./settings";

interface ImageConfig {
	src: string;
	alt: string;
	key: string;
}

const IMAGE_CONFIGS: ImageConfig[] = [
	{ src: catIdle, alt: "Cat idle", key: "idle", },
	{ src: catLeft, alt: "Cat left", key: "left", },
	{ src: catRight, alt: "Cat right", key: "right", },
]

export default class TypingCatImagePlugin extends Plugin {
	settings: TypingCatSettings;
	private overlayEl?: HTMLDivElement;
	private imageElements: Map<string, HTMLImageElement> = new Map();

	async onload() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		this.injectOverlay();
		await this.renderImage();

		this.addSettingTab(new TypingCatSettingTab(this.app, this));
	}

	onunload() {
		this.destroyOverlay();
	}

	private injectOverlay() {
		if (this.overlayEl) return;

		const overlay = activeDocument.body.createEl("div", {
			cls: "typing-cat-container",
		});

		overlay.style.setProperty("--tci-left", `${this.settings.leftPercent}vw`);
		overlay.style.setProperty("--tci-bottom", `${this.settings.bottomPercent}vh`);
		overlay.style.setProperty("--tci-opacity", `${this.settings.opacity}`);
		overlay.style.setProperty("--tci-width", `${this.settings.widthPercent}vw`);
		overlay.style.setProperty("--tci-pointer-events", this.settings.clickable ? "auto" : "none");
		overlay.style.setProperty("--tci-transform", this.settings.mirror ? "scaleX(-1)" : "none");

		IMAGE_CONFIGS.forEach((config) => {
			const img = overlay.createEl("img", {
				cls: `typing-cat-image ${config.key}`,
				attr: {
					src: config.src,
					alt: config.alt,
					draggable: "false",
				},
			});

			this.imageElements.set(config.key, img);
		});

		this.overlayEl = overlay;
	}

	private destroyOverlay() {
		if (this.overlayEl?.parentElement) this.overlayEl.parentElement.removeChild(this.overlayEl);
		this.overlayEl = undefined;
		this.imageElements.clear();
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.applyStylesFromSettings();
		await this.renderImage();
	}

	private applyStylesFromSettings() {
		if (!this.overlayEl) return;

		this.overlayEl.style.setProperty("--tci-left", `${this.settings.leftPercent}vw`);
		this.overlayEl.style.setProperty("--tci-bottom", `${this.settings.bottomPercent}vh`);
		this.overlayEl.style.setProperty("--tci-opacity", `${this.settings.opacity}`);
		this.overlayEl.style.setProperty("--tci-width", `${this.settings.widthPercent}vw`);
		this.overlayEl.style.setProperty("--tci-pointer-events", this.settings.clickable ? "auto" : "none");
		this.overlayEl.style.setProperty("--tci-transform", this.settings.mirror ? "scaleX(-1)" : "none");
	}

	private async renderImage() {
		if (this.imageElements.size === 0) return;

		IMAGE_CONFIGS.forEach((config) => {
			const img = this.imageElements.get(config.key);
			if (img) {
				img.src = config.src;
			}
		});
	}
}

