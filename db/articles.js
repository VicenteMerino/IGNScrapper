const { Entity, Table } = require("dynamodb-toolbox");
const DynamoDB = require("./settings");
const { v4: uuidv4 } = require("uuid");

const ArticlesTable = new Table({
  name: "MU-Articles",
  partitionKey: "id",
  DocumentClient: DynamoDB,
});

const Article = new Entity({
  name: "Article",
  table: ArticlesTable,
  timestamps: true,
  attributes: {
    id: { partitionKey: true, type: "string" },
    publication_date: { type: "string" },
    article_link: { type: "string" },
    image_source: { type: "string" },
    title: { type: "string" },
    subtitle: { type: "string" },
    news_source: { type: "string" },
    sent_to_telegram: { type: "boolean" },
    category: { type: "string" },
  },
});

const filterByArticleLink = async (articleLinks) => {
  const articleResponse = await ArticlesTable.scan({
    limit: 100,
    attributes: ["article_link"],
    filters: { attr: "article_link", in: articleLinks },
  });
  return articleResponse;
};

const createMultipleArticles = async (data) => {
  const articlesResponse = await ArticlesTable.batchWrite(
    data.map((article) =>
      Article.putBatch({
        id: uuidv4(),
        publication_date: article.publicationDate,
        article_link: article.articleLink,
        image_source: article.imageSrc,
        title: article.title,
        subtitle: article.subtitle,
        news_source: "IGN",
        sent_to_telegram: false,
        category: "videogames",
      })
    ),
    {
      capacity: "total",
      metrics: "size",
    }
  );
  return articlesResponse;
};

module.exports = {
  createMultipleArticles,
  filterByArticleLink,
};
