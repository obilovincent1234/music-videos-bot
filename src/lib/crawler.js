const Cache = require("./cache");
const { readFileSync } = require("fs");
const puppeteer = require("puppeteer-extra");
const referrers = require("../config/referrers.json");
const { cache: cacheConfig, perPage } = require("../config");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AnonymizeUA = require("puppeteer-extra-plugin-anonymize-ua");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const preloadFile = readFileSync(__dirname + "/../config/preload.js", "utf8");

// Plugins
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
puppeteer.use(AnonymizeUA({ stripHeadless: true }));
puppeteer.use(StealthPlugin());

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
                args: [
                    "--disable-gpu",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-setuid-sandbox",
                    "--disable-infobars",
                    "--window-position=0,0",
                    "--ignore-certifcate-errors",
                    "--ignore-certifcate-errors-spki-list",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--blink-settings=imagesEnabled=true",
                ],
                headless: true, // Change to true for production use
                ignoreHTTPSErrors: true,
                slowMo: 0,
            });

            this.isLaunched = true;
        }
    }

    /**
     * Web crawler
     * @param {string} url - The URL to scrape
     * @param {Function} transform - Transformation function to apply on the page
     * @returns {Promise<any>} - Scraped data
     */
    async scrape(url, transform) {
        try {
            // Set a random referer
            const referer = referrers[Math.floor(Math.random() * referrers.length)];
            
            // Launch the browser if not already launched
            await this.launchBrowser();
            
            // Create a new page
            const page = await this.browser.newPage();
            await page.setCacheEnabled(false); // Disable caching
            await page.setExtraHTTPHeaders({ referer }); // Set random referrer header
            await page._client.send("Network.clearBrowserCookies"); // Clear cookies
            await page.evaluateOnNewDocument(preloadFile); // Inject preload script
            await page.goto(url, { waitUntil: "load", timeout: 0 }); // Navigate to URL
            await page.addScriptTag({ path: require.resolve("jquery") }); // Inject jQuery
            const response = await page.evaluate(transform); // Execute transformation function
            await page.close(); // Close the page
            
            return response; // Return scraped data
        } catch (error) {
            throw error; // Throw any encountered errors
        }
    }
};
