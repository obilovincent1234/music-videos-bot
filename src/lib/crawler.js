const Xvfb = require('xvfb');
const xvfb = new Xvfb();

xvfb.startSync();

const puppeteer = require("puppeteer-extra");
const Cache = require("./cache");
const { readFileSync } = require("fs");
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

// Transformation function to extract data from the page
const transform = () => {
    // Replace 'selector' with your specific selector to match the elements you want to scrape
    return Array.from(document.querySelectorAll('selector')).map(el => el.innerText);
};

module.exports = class Crawler {
    constructor(options) {
        let cacheOptions;
        if (options) cacheOptions = options.cache;
        this.cache = new Cache(cacheConfig, cacheOptions);
        this.isLaunched = false;
        this.perPage = options && options.perPage ? options.perPage : perPage;

        return new Proxy(this, {
            get: function (driver, property) {
                if (property in driver) return driver[property];
                return function () {
                    throw new Error("No implementation found!");
                };
            },
        });
    }

    async launchBrowser() {
        if (!this.isLaunched) {
            this.browser = await puppeteer.launch({
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--single-process",
                    "--no-zygote",
                    "--window-size=1920,1080"
                ],
                headless: true,
                ignoreHTTPSErrors: true,
                slowMo: 0,
            });
            this.isLaunched = true;
        }
    }

    async scrape(url, transform) {
        try {
            const referer = referrers[Math.floor(Math.random() * referrers.length)];
            await this.launchBrowser();
            const page = await this.browser.newPage();
            await page.setCacheEnabled(false);
            await page.setExtraHTTPHeaders({ referer });
            await page._client.send("Network.clearBrowserCookies");
            await page.evaluateOnNewDocument(preloadFile);
            await page.goto(url, { waitUntil: "load", timeout: 0 });

            const content = await page.content();
            console.log(content);

            await page.addScriptTag({ path: require.resolve("jquery") });
            const response = await page.evaluate(transform);

            console.log(response);

            await page.close();
            return response;
        } catch (error) {
            console.error("Error during scraping:", error);
            throw error;
        }
   
    }
};
