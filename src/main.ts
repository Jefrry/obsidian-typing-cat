import { Plugin } from "obsidian";
import { catIdle } from "./images/cat-idle";
import { catLeft } from "./images/cat-left";
import { catRight } from "./images/cat-right";
import { heart } from "./images/heart";
import { sweat } from "./images/sweat";
import { DEFAULT_SETTINGS, TypingCatSettingTab, TypingCatSettings, SpeedMetric } from "./settings";

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
	private speedOverlayEl?: HTMLDivElement;
	private speedTextEl?: HTMLDivElement;
	private imageElements: Map<string, HTMLImageElement> = new Map();
	private typingTimeout: number | null = null;
	private lastHand: "left" | "right" = "right";
	private heartEl?: HTMLImageElement;
	private sweatEl?: HTMLImageElement;
	private lastHeartTime = 0;
	private typingSessionStart: number | null = null;
	private readonly HEART_THROTTLE = 500; // ms
	private readonly SWEAT_DELAY = 3000; // ms

	private typed: number[] = [0];
	private keyTypedInSecond = 0;
	private wordTypedInSecond = 0;
	private readonly pollingInterval = 1.0;

	async onload() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<TypingCatSettings>);

		this.injectOverlay();
		await this.renderImage();

		this.addSettingTab(new TypingCatSettingTab(this.app, this));

		this.registerEvent(this.app.workspace.on("editor-change", this.onTyping));

		this.registerDomEvent(document, "keydown", (evt: KeyboardEvent) => {
			if (!this.settings.showSpeed) return;

			// Check if it's a single printable character
			if (evt.key.length === 1 && !evt.ctrlKey && !evt.altKey && !evt.metaKey) {
				this.keyTypedInSecond += 1;
				this.wordTypedInSecond += 1 / 5.0;
			}
		});

		this.registerInterval(
			window.setInterval(() => {
				if (!this.settings.showSpeed || !this.speedTextEl) return;

				let added = 0;
				if (this.settings.speedMetric === SpeedMetric.CPS || this.settings.speedMetric === SpeedMetric.CPM) {
					added = this.keyTypedInSecond;
					this.keyTypedInSecond = 0;
				} else if (this.settings.speedMetric === SpeedMetric.WPM) {
					added = this.wordTypedInSecond;
					this.wordTypedInSecond = 0;
				}

				if (!this.hasStoppedTyping() || added != 0) {
					if (this.hasStoppedTyping()) {
						this.typed = [];
					}

					if (this.typed.length > this.pollingInterval * 10) {
						this.typed.shift();
						this.typed.push(added);
					} else {
						this.typed.push(added);
					}

					const fact = this.getMetricFactor(this.settings.speedMetric);
					const average = Math.round(this.averageArray(this.typed) * fact);
					this.speedTextEl.setText(`${average} ${this.settings.speedMetric}`);
				}
			}, 1000 / this.pollingInterval)
		);
	}

	private getMetricFactor(metric: SpeedMetric): number {
		switch (metric) {
			case SpeedMetric.CPM:
			case SpeedMetric.WPM:
				return 60.0;
			case SpeedMetric.CPS:
				return 1.0;
			default:
				return 60.0;
		}
	}

	private averageArray(array: number[]): number {
		const avg = array.reduce((a: number, b: number) => a + b, 0);
		return avg / array.length || 0;
	}

	private hasStoppedTyping(): boolean {
		const second_check = 2 * this.pollingInterval;
		const check_start = this.typed.length - second_check;

		if (check_start < 0) {
			return false;
		}

		for (let i = check_start; i < this.typed.length; i++) {
			if (this.typed[i] != 0) {
				return false;
			}
		}
		return true;
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

		this.sweatEl = overlay.createEl("img", {
			cls: "typing-cat-sweat",
			attr: {
				src: sweat,
				alt: "Sweat",
				draggable: "false",
			},
		});

		this.speedOverlayEl = overlay.createEl("div", {
			cls: "typing-cat-speed-overlay",
		});

		this.speedTextEl = this.speedOverlayEl.createEl("div", {
			cls: "typing-cat-speed-text",
			text: `0 ${this.settings.speedMetric}`,
		});

		this.speedTextEl.style.setProperty("--tci-transform", this.settings.mirror ? "scaleX(-1)" : "none");

		if (!this.settings.showSpeed) {
			this.speedOverlayEl.addClass("tci-hidden");
		}

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
		void this.heartEl.offsetWidth; // reflow to restart animation
		this.heartEl.addClass("animate");
	}

	private destroyOverlay() {
		if (this.overlayEl?.parentElement) this.overlayEl.parentElement.removeChild(this.overlayEl);
		this.overlayEl = undefined;
		this.imageElements.clear();
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateUIFromSettings();
		await this.renderImage();
	}

	private updateUIFromSettings() {
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

		if (!this.speedOverlayEl || !this.speedTextEl) return;

		this.speedTextEl.style.setProperty("--tci-transform", this.settings.mirror ? "scaleX(-1)" : "none");
		this.speedTextEl.setText(`0 ${this.settings.speedMetric}`);

		if (this.settings.showSpeed) {
			this.speedOverlayEl.removeClass("tci-hidden");
		} else {
			this.speedOverlayEl.addClass("tci-hidden");
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

		this.updateSweat();
		this.toggleHands(idle, left, right);
		this.scheduleIdleReset(idle, left, right);
	};

	private updateSweat() {
		if (this.typingSessionStart === null) {
			this.typingSessionStart = Date.now();
		}

		const elapsed = Date.now() - this.typingSessionStart;
		if (elapsed > this.SWEAT_DELAY && this.sweatEl) {
			this.sweatEl.addClass("is-active");
		}
	}

	private toggleHands(idle: HTMLElement, left: HTMLElement, right: HTMLElement) {
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
	}

	private scheduleIdleReset(idle: HTMLElement, left: HTMLElement, right: HTMLElement) {
		if (this.typingTimeout) {
			window.clearTimeout(this.typingTimeout);
		}

		this.typingTimeout = window.setTimeout(() => {
			this.resetToIdle(idle, left, right);
		}, 1000);
	}

	private resetToIdle(idle: HTMLElement, left: HTMLElement, right: HTMLElement) {
		idle.removeClass("is-hidden");
		left.removeClass("is-active");
		right.removeClass("is-active");

		if (this.sweatEl) {
			this.sweatEl.removeClass("is-active");
		}
		this.typingSessionStart = null;
		this.typingTimeout = null;
	}
}

