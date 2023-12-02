const { OpenAI } = require("openai");
const { getValue } = require("./db");

/**
 * @param {string[]} messages
 * @returns {Promise<string>}
 */
module.exports.askAI = async (messages) => {
  const apiKey = await getValue("OPENAI_API_KEY");
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // gpt-4 is slow, so use gpt-3.5-turbo
    messages,
    max_tokens: 500,
  });
  return response.choices[0].message.content;
};
