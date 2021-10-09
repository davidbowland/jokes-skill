const Alexa = require('ask-sdk-core')
const axios = require('axios')

// const logIt = (label) => (whatever) => {
//   console.log(label, whatever)
//   return whatever
// }

/* API */

const api = axios.create({
  baseURL: 'https://i8m4dc6jfh.execute-api.us-east-2.amazonaws.com',
})

const getJokesFromApi = (count) =>
  api.request({
    method: 'GET',
    params: { count },
    url: '/v1/jokes/random',
  })

/* Responses */

const generateEmptyResponse = (handlerInput) => () => handlerInput.responseBuilder.getResponse()

const generateRepromptResponse = (handlerInput, repromptOutput) => (speakOutput) =>
  handlerInput.responseBuilder
    .speak(repromptOutput ? `${speakOutput}<break time="1.25s"/>\n ${repromptOutput}` : speakOutput)
    .reprompt(repromptOutput || speakOutput)
    .getResponse()

const generateSimpleResponse = (handlerInput) => (speakOutput) =>
  handlerInput.responseBuilder.speak(speakOutput).getResponse()

/* Get joke */

const getJokeFromResult = (result) => Object.values(result.data)[0].joke

const getFallbackJoke = () => 'Did you hear about the circus fire? It was in tents!'

const getJokeReprompt = () => 'Would you like to hear another joke?'

const JokeIntentHandler = {
  canHandle: (handlerInput) =>
    Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest' ||
    (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) === 'JokeIntent' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent')),
  handle: (handlerInput) =>
    getJokesFromApi(1)
      .then(getJokeFromResult)
      .catch((error) => (logError(error)(), getFallbackJoke()))
      .then(generateRepromptResponse(handlerInput, getJokeReprompt()))
      .catch((error) => ErrorHandler.handle(handlerInput, error)),
}

/* Help */

const getHelpContent = () => 'You can ask me to tell you a joke.'

const HelpIntentHandler = {
  canHandle: (handlerInput) =>
    Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
    Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent',
  handle: (handlerInput) =>
    Promise.resolve(getHelpContent())
      .then(generateRepromptResponse(handlerInput))
      .catch((error) => ErrorHandler.handle(handlerInput, error)),
}

/* Cancel */

const getCancelContent = () => 'Goodbye!'

const CancelAndStopIntentHandler = {
  canHandle: (handlerInput) =>
    Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
    (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent' ||
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent'),
  handle: (handlerInput) =>
    Promise.resolve(getCancelContent())
      .then(generateSimpleResponse(handlerInput))
      .catch((error) => ErrorHandler.handle(handlerInput, error)),
}

/* Fallback */

const getFallbackContent = () => "Sorry, I'm afraid I don't know that."

const getFallbackReprompt = () => "Why don't you try asking me to tell you a joke?"

const FallbackIntentHandler = {
  canHandle: (handlerInput) =>
    Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
    Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent',
  handle: (handlerInput) =>
    Promise.resolve(getFallbackContent())
      .then(generateRepromptResponse(handlerInput, getFallbackReprompt()))
      .catch((error) => ErrorHandler.handle(handlerInput, error)),
}

/* Session ended */

const endSession = (handlerInput) => console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`)

const SessionEndedRequestHandler = {
  canHandle: (handlerInput) => Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest',
  handle: (handlerInput) =>
    Promise.resolve(endSession())
      .then(generateEmptyResponse(handlerInput))
      .catch((error) => ErrorHandler.handle(handlerInput, error)),
}

/* Error */

const getErrorText = () => 'Sorry, I had trouble doing what you asked. Please try again.'

// prettier-ignore
const logError = (error) => (value) => (console.error(`~~~~ Error handled: ${JSON.stringify(error)}`), value)

const ErrorHandler = {
  canHandle: () => true,
  handle: (handlerInput, error) =>
    Promise.resolve(getErrorText())
      .then(generateRepromptResponse(handlerInput))
      .then(logError(error)),
}

/* Handler */

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    JokeIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent('david-jokes/v1.3')
  .lambda()
