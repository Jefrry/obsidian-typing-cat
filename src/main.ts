import { Plugin } from "obsidian";
import { catIdle } from "./images/cat-idle";
import { catLeft } from "./images/cat-left";
import { catRight } from "./images/cat-right";
import { heart } from "./images/heart";
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
	private typingTimeout: number | null = null;
	private lastHand: "left" | "right" = "right";
	private heartEl?: HTMLImageElement;
	private lastHeartTime = 0;
	private readonly HEART_THROTTLE = 500; // ms

	async onload() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<TypingCatSettings>);

		this.injectOverlay();
		await this.renderImage();

		this.addSettingTab(new TypingCatSettingTab(this.app, this));

		this.registerEvent(this.app.workspace.on("editor-change", this.onTyping));
	}

	onunload() {
		if (this.typingTimeout) window.clearTimeout(this.typingTimeout);
		this.destroyOverlay();
	}

	private injectOverlay() {
		if (this.overlayEl) return;

		const overlay = document.body.createEl("div", {
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

		this.heartEl = overlay.createEl("img", {
			cls: "typing-cat-heart",
			attr: {
				src: heart,
				alt: "Heart",
				draggable: "false",
			},
		});

		if (!this.settings.clickable) {
			this.heartEl.addClass("tci-hidden");
		}

		overlay.addEventListener("click", () => {
			if (!this.settings.clickable) return;
			this.playHeartAnimation();
		});

		this.overlayEl = overlay;
	}

	private playHeartAnimation() {
		if (!this.heartEl) return;

		const now = Date.now();
		if (now - this.lastHeartTime < this.HEART_THROTTLE) return;

		this.lastHeartTime = now;
		
		this.heartEl.removeClass("animate");
		this.heartEl!.offsetWidth; // reflow to restart animation
		this.heartEl.addClass("animate");
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

		if (this.heartEl) {
			if (this.settings.clickable) {
				this.heartEl.removeClass("tci-hidden");
			} else {
				this.heartEl.addClass("tci-hidden");
			}
		}
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

	private onTyping = () => {
		const idle = this.imageElements.get("idle");
		const left = this.imageElements.get("left");
		const right = this.imageElements.get("right");

		if (!idle || !left || !right) return;

		if (this.typingTimeout) {
			window.clearTimeout(this.typingTimeout);
		}

		idle.addClass("is-hidden");

		if (this.lastHand === "right") {
			left.addClass("is-active");
			right.removeClass("is-active");
			this.lastHand = "left";
		} else {
			left.removeClass("is-active");
			right.addClass("is-active");
			this.lastHand = "right";
		}

		this.typingTimeout = window.setTimeout(() => {
			idle.removeClass("is-hidden");
			left.removeClass("is-active");
			right.removeClass("is-active");

			this.typingTimeout = null;
		}, 1000);
	};
}

