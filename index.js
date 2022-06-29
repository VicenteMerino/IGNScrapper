const chromium = require("chrome-aws-lambda");
const moment = require("moment");
const {
  createMultipleArticles,
  filterByArticleLink,
} = require("./db/articles");

const fetchArticles = async (event, context) => {
  const extension = event["extension"];
  const articlesUrl = `https://ign.com/games/${extension}`;
  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(0);

    await Promise.all([
      page.goto(articlesUrl),
      page.waitForSelector("div.content-item", {
        visible: true,
        hidden: true,
      }),
    ]);

    const articles = await page.$$eval("div.content-item", (el) => {
      return el.map((e) => {
        const itemBody = e.querySelector("a.item-body");
        const itemTitle = e.querySelector("h3.item-title");
        const itemSubtitle = e.querySelector("div.item-subtitle");
        const image = itemBody.querySelector("img");
        const dataTimeAgo = itemTitle?.getAttribute("data-timeago");

        return {
          articleLink: itemBody?.href,
          imageSrc: image?.src,
          title: itemTitle?.innerText,
          subtitle: itemSubtitle?.innerText?.split("-")?.[1]?.trim(),
          publicationDate: dataTimeAgo,
        };
      });
    });

    const mappedArticles = articles
      .filter((article) => {
        return moment(article.publicationDate, "YYYY-MM-DD").isAfter(
          moment().subtract(30, "days")
        );
      })
      .map((article) => {
        return {
          ...article,
          publicationDate: moment(article.publicationDate, "YYYY-MM-DD")
            .toDate()
            .toISOString(),
        };
      });
    await browser.close();
    const articlesLinks = mappedArticles.map((article) => article.articleLink);
    const currentArticles = await filterByArticleLink(articlesLinks);
    const newArticles = mappedArticles.filter((article) => {
      return !currentArticles.Items.some(
        (currentArticle) => currentArticle.article_link === article.articleLink
      );
    });

    if (newArticles.length > 0) {
      const result = await createMultipleArticles(newArticles);
      return result;
    } else {
      return { msg: "No articles found" };
    }
  } catch (error) {
    console.log(error);
    await browser?.close();
    return { msg: "Error fetching articles", error };
  }
};

exports.handler = fetchArticles;
