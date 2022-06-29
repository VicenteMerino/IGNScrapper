const AWS = require("aws-sdk");
require("dotenv").config();

AWS.config.update({
  region: process.env.AWS_DYNAMO_DEFAULT_REGION,
  accessKeyId: process.env.AWS_DYNAMO_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_DYNAMO_SECRET_ACCESS_KEY,
});

const DynamoDB = new AWS.DynamoDB.DocumentClient();

module.exports = DynamoDB;
