import chromium from "chrome-aws-lambda";
import { Browser } from "puppeteer-core";
import sleep from "./helper/sleep";

const fetchArticles = async (extension: string) => {
  const articlesUrl = `https://ign.com/games/${extension}`;
  let browser: Browser | null = null;
  try {
    browser = await chromium.puppeteer.launch({
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.goto(articlesUrl);
    await sleep(3);
    await page.waitForSelector("div.content-item");

    const articles = await page.$$eval("div.content-item", (el) => {
      return el.map((e) => {
        const itemBody = e.querySelector("a.item-body");
        const itemTitle = e.querySelector("h3.item-title");
        const itemSubtitle = e.querySelector("div.item-subtitle");
        const image = itemBody.querySelector("img");

        return [
          itemBody?.href,
          image?.src,
          itemTitle?.innerText,
          itemSubtitle?.innerText?.split("-")?.[1]?.trim(),
          itemTitle?.getAttribute("data-timeago"),
        ];
      });
    });

    console.log(articles);

    await browser.close();
  } catch (error) {
    console.log(error);
    await browser?.close();
  }
};

fetchArticles("the-elder-scrolls-6");
