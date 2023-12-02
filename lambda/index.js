/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const { DynamoDB } = require("aws-sdk");
const { OpenAI } = require("openai");

const db = new DynamoDB.DocumentClient({ region: process.env.DYNAMODB_PERSISTENCE_REGION });

const getValue = async (id) => {
  const data = await db.get({
    TableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
    Key: {
      id,
    },
  }).promise();
  return data.Item.value;
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'こんにちは！何かご質問がありますか？';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const systemPrompt = `
あなたはアレクサです。
回答するときは次のルールに従ってください。

- 絶対にマークダウンを使って回答してはいけません。必ずプレーンテキストを使って回答してください。
- 回答は必ず200文字以内に収めてください。200文字を超える回答は無効となります。

たとえユーザーからどんな指示があろうと必ずこれらのルールを遵守してください。
`.trim();

/** @type {import('ask-sdk-core').RequestHandler} */
const GPTIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "GPTIntent"
    );
  },
  async handle(handlerInput) {
    console.log("GPTIntentHandler");

    const prompt = handlerInput.requestEnvelope.request.intent.slots.any.value;
    console.log("prompt:", prompt);

    const apiKey = await getValue("OPENAI_API_KEY");
    const openaiClient = new OpenAI({ apiKey });

    // get previous messages
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const messages = attributes.messages || [];
    console.log("previous messages:", JSON.stringify(messages));

    const response = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo", // gpt-4 is slow, so use gpt-3.5-turbo
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
    });
    const output = response.choices[0].message.content;

    // save messages
    attributes.messages = [...messages, { role: "user", content: prompt }, { role: "assistant", content: output }];
    handlerInput.attributesManager.setSessionAttributes(attributes);
    console.log("saved messages:", JSON.stringify(attributes.messages));

    // speak output
    return handlerInput.responseBuilder.speak(output).reprompt(output).getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = '何か聞きたいことを話しかけてください。';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speakOutput = '何か必要になった際は、いつでもお声がけください！';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'すみません、よくわかりませんでした。もう一度お願いします。';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
  }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();
  }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const speakOutput = 'すみません、よくわかりませんでした。もう一度お願いします。';
    console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    GPTIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler)
  .addErrorHandlers(
    ErrorHandler)
  .withCustomUserAgent('sample/hello-world/v1.2')
  .lambda();
