/**
 * This sample shows how to create a simple Lambda function for handling speechlet requests.
 */
var https = require('https');
var intentContext = null;

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and replace application.id with yours
         * to prevent other voice applications from using this function.
         */
        
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[APP-ID]") {
            context.fail("Invalid Application ID");
        }
        
        intentContext = context;
        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session, 
                     function callback(sessionAttributes, speechletResponse) {
                        console.log("success");
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);

            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
                + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the app without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
                + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/** 
 * Called when the user specifies an intent for this application.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
                + ", sessionId=" + session.sessionId);


    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
    
    console.log("Intent: " + intentName)
    
    if ("AirConditionIntent" === intentName) {
        console.log("set temperature");
        setTemperature(intent, session, callback);
    } else if ("ThermostatIntent" === intentName){
        console.log("set thermostat");
        setThermostat(intent, session, callback);       
    }
    else if ("TemperatureIntent" === intentName) {
        getTemperature(intent, session, callback);
    }  else if ("HelpIntent" === intentName){
        help(intent, session, callback);
    }
    else {
        throw "Invalid intent";
    }    
}

/**
 * Called when the user ends the session.
 * Is not called when the app returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
                + ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

/**
 * Helpers that build all of the responses.
 */
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    }
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    }
}

/** 
 * Functions that control the app's behavior.
 */
function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to the Nest Manager app."
                + "  You can get and set the temperature."                
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "I don't understand.  Say help for assistance";
    var shouldEndSession = false;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function setTemperature(intent, session, callback) {
    var cardTitle = intent.name;
    var temperature = intent.slots.Temperature;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = ""; 

    
    setTemperatureOnNest(temperature, function innerCallback(message){
        if(message === "success"){
            speechOutput = "I have set the temperature to " + temperature.value;
        } else {
            speechOutput = "There was an error setting the temperature";
        }
        
        callback(sessionAttributes,
            buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));   
    });
    
}

function setThermostat(intent, session, callback) {
    var cardTitle = intent.name;
    var state = intent.slots.State;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = ""; 

    
    setThermostatOnNest(state, function innerCallback(message){
        console.log(message);
        if(message === "success"){
            speechOutput = "Done.";
        } else {
            speechOutput = "There was an error setting the thermostat";
        }
        console.log(speechOutput);
        callback(sessionAttributes,
            buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));   
    });
    
}

function getTemperature(intent, session, callback) {
    var cardTitle = intent.name;
    var favoriteColor;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    getTemperatureFromNest(function innerCallback(temperature){
        if(temperature === "failure"){
            speechOutput = "Failed to get the temperature.";
        } else {
            speechOutput = "The temperature is " + temperature  + " degrees.";
        }
        callback(sessionAttributes,
            buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));   
    })

    
}

function help(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    speechOutput = "You can get and set the temperature, here are some examples.    "
            + "Set the temperature to seventy two.  "
            + "Set the a c to seventy five. "
            + "What is the temperature. "
            + "How hot is it in here?";

    callback(sessionAttributes,
        buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));   
}

function getNestStateId() {
    var hexChars = ['a', 'b', 'c', 'd', 'e', 'f', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    var id = "";
    for(var i = 0; i < 8; ++i){
        id = id + hexChars[Math.floor(Math.random()*hexChars.length)];
    }

    return id;
}

function setTemperatureOnNest(temperature, callback){
    var stateId = "logikz";//getNestStateId();    
    var authOptions = {
        hostname: "server.host",
        port: 443,
        path: "/nest/" + stateId + "/temperature/",
        method: "PUT",
        headers: {
           'Accept': '*/*',
           'Content-Type': 'text/plain'
        }
    };
    var request = https.request(authOptions, function(response){
        console.log(response.statusCode);
        callback("success");
    }).on('error', function(error){
        callback("failure:" + error.message);
    });
    
    request.write(temperature.value.toString());
    request.end();
    console.log("request ended");
}

function setThermostatOnNest(state, callback){
    var stateId = "logikz";//getNestStateId();    
    var authOptions = {
        hostname: "server.host",
        port: 443,
        path: "/nest/" + stateId + "/thermostat/",
        method: "PUT",
        headers: {
           'Accept': '*/*',
           'Content-Type': 'text/plain'
        }
    };
    var request = https.request(authOptions, function(response){
        console.log(response.statusCode);
        callback("success");

    }).on('error', function(error){
        callback("failure:" + error.message);
    });
    
    request.write(state.value.toString());
    request.end();
    console.log("request ended");
}

function getTemperatureFromNest(callback){
    var stateId = "logikz";
    var authOptions = {
        hostname: "server.host",
        port: 443,
        path: "/nest/" + stateId + "/temperature/",
        method: "GET",
        headers: {
           'Accept': '*/*',
           'Content-Type': 'text/plain'
        }
    };
    var request = https.request(authOptions, function(response){
        console.log(response.statusCode);
        if(response.statusCode == 200){
            response.on("data", function(data){
                console.log(data);
                callback(data);
            })
        } else {
            callback("failure");
        }
    }).on('error', function(error){
        callback("failure:" + error.message);
    });
    
    request.end();
    console.log("request ended");
}