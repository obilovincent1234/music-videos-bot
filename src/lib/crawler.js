const Cache = require("./cache");
const puppeteer = require("puppeteer-extra");
const { cache: cacheConfig, perPage } = require("../config");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

module.exports = class Crawler {
	constructor(options) {
		// Configure cache
		let cacheOptions;
		if (options) cacheOptions = options.cache;
		this.cache = new Cache(cacheConfig, cacheOptions);

		// Browser launch check
		this.isLaunched = false;

		// Results per page
		this.perPage = options && options.perPage ? options.perPage : perPage;

		// Throw error for methods not found
		return new Proxy(this, {
			get: function (driver, property) {
				// If method exists
				if (property in driver) return driver[property];
				// Else
				return function () {
					throw new Error("No implementation found!");
				};
			},
		});
	}

	/*
	 * Initialize the browser
	 * Ensure only a browser is running
	 */
	async launchBrowser() {
		if (!this.isLaunched) {
			this.browser = await puppeteer.launch({
				args: ["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"],
				headless: true,
			});

			this.isLaunched = true;
		}
	}

	/**
	 * Web crawler
	 * @param url
	 * @param transform
	 */
	scrape(url, transform) {
		return new Promise(async (resolve, reject) => {
			try {
				await this.launchBrowser();
				const page = await this.browser.newPage();
				await page.setCacheEnabled(false);
				await page.goto(url, { waitUntil: "load", timeout: 0 });
				await page.addScriptTag({ path: require.resolve("jquery") });
				const response = await page.evaluate(transform);
				// NOTE Closing the page immediately after scraping seem to occasionally interrupt the browser execution context
				// Ensure to close the entire browser at the driver level after scraping
				// await page.close();
				return resolve(response);
			} catch (error) {
				return reject(error);
			}
		});
	}
};
