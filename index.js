const restify = require('restify');
const builder = require('botbuilder');
const dialogs = require('./dialogs');

// Setup Restify Server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

//=========================================================
// Bot Setup
//=========================================================
  
// Create chat bot
let connector = new builder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_PASSWORD
});

var inMemoryStorage = new builder.MemoryBotStorage();

let bot = new builder.UniversalBot(connector)
  .set('storage', inMemoryStorage); // Register in-memory storage
server.post('/api/messages', connector.listen());

// load all dialogs

let dialogNames = Object.keys(dialogs);
for (dialogName of dialogNames) {
  bot.dialog(dialogName, dialogs[dialogName]);
}

// root dialog
bot.dialog('/', [
  (session, results, next) => {
    session.beginDialog('welcome');
  }
])