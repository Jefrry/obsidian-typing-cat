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
	opacity: string;
	key: string;
	position: string;
	top: string;
	left: string;
}

const IMAGE_CONFIGS: ImageConfig[] = [
	{ src: catIdle, alt: "Cat idle", opacity: "1", key: "idle", position: "relative", top: "0", left: "0" },
	{ src: catLeft, alt: "Cat left", opacity: "0", key: "left", position: "absolute", top: "0", left: "0" },
	{ src: catRight, alt: "Cat right", opacity: "0", key: "right", position: "absolute", top: "0", left: "0" },
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

		const overlay = document.createElement("div");
		overlay.className = "typing-cat-container";

		overlay.style.setProperty("--tci-left", `${this.settings.marginLeftPx}px`);
		overlay.style.setProperty("--tci-bottom", `${this.settings.marginBottomPx}px`);
		overlay.style.setProperty("--tci-opacity", `${this.settings.opacity}`);
		overlay.style.setProperty("--tci-width", `${this.settings.widthPx}px`);
		overlay.style.setProperty("--tci-pointer-events", this.settings.clickable ? "auto" : "none");

		IMAGE_CONFIGS.forEach((config) => {
			const img = document.createElement("img");
			img.alt = config.alt;
			img.draggable = false;
			img.style.position = config.position;
			img.style.top = config.top;
			img.style.left = config.left;
			img.style.opacity = config.opacity;
			img.src = config.src;

			overlay.appendChild(img);
			this.imageElements.set(config.key, img);
		});

		document.body.appendChild(overlay);
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

		this.overlayEl.style.setProperty("--tci-left", `${this.settings.marginLeftPx}px`);
		this.overlayEl.style.setProperty("--tci-bottom", `${this.settings.marginBottomPx}px`);
		this.overlayEl.style.setProperty("--tci-opacity", `${this.settings.opacity}`);
		this.overlayEl.style.setProperty("--tci-width", `${this.settings.widthPx}px`);
		this.overlayEl.style.setProperty("--tci-pointer-events", this.settings.clickable ? "auto" : "none");
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

