const { DynamoDB } = require("aws-sdk");

const db = new DynamoDB.DocumentClient({
  region: process.env.DYNAMODB_PERSISTENCE_REGION,
});

/**
 * @param {string} key
 * @returns {Promise<string>}
 */
module.exports.getValue = async (key) => {
  const data = await db
    .get({
      TableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
      Key: { id: key },
    })
    .promise();
  return data.Item.value;
};
