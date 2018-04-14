const restify = require('restify');
const builder = require('botbuilder');

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
let bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// root dialog
bot.dialog('/', [
  (session, results, next) => {
    session.send('hi');
  }
])