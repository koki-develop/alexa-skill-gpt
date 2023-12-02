/**
 * @param {import('ask-sdk-core').HandlerInput} handlerInput
 * @param {string} output
 * @param {{ reprompt?: boolean }} [options]
 */
module.exports.speak = (handlerInput, output, options) => {
  let responseBuilder = handlerInput.responseBuilder.speak(output);
  if (options && options.reprompt) {
    responseBuilder = responseBuilder.reprompt(output);
  }
  return responseBuilder.getResponse();
};
