const builder = require('botbuilder');
const api = require('../router');
const vision = require('../router/vision');

const categoryChoices = [ 'Sneakers', 'Clothes', 'ImageScanner' ];
const SECONDS_DELAY_MSG = 10;

const APP_BASE_URL = process.env.APP_BASE_URL;

const defaultStock = [
  {
    name: 'dummy name 1',
    stock: 20,
    store_id: "1",
    timerange: [
      "19:00",
      "19:30",
      "19:45"
    ]
  },
  {
    name: 'dummy name 2',
    stock: 30,
    store_id: "2",
    timerange: [
      "18:00",
      "18:30",
      "18:45"
    ]
  },
  {
    name: 'dummy name 3',
    stock: 40,
    store_id: "3",
    timerange: [
      "15:00",
      "15:30",
      "15:45"
    ]
  }
];


function createButtonsMessage(session, text, choices) {
  let buttons = choices.map((choice) => {
    return builder.CardAction.imBack(session, choice, choice);
  });
	return new builder.Message(session)
		.text(text)
		.attachments([new builder.Keyboard(session).buttons(buttons)]);
	// builder.Prompts.text(session, msg, args);
}

function createCardWithButtons(session, text, buttonsValue, buttonsText) {
  let buttons = []
  for(let i = 0; i < buttonsText.length; i++) {
    buttons.push(builder.CardAction.imBack(session, buttonsValue[i], buttonsText[i]));
  }
    
  let card = new builder.HeroCard(session)
    .text(text)
    .buttons(buttons);

  let msg = new builder.Message(session)
    .attachments([card]);
  return msg;
}

let welcome = [
  (session, results, next) => {
    // send welcome to the user
    session.send('welcome');
    
    // choose sneakers || clothes
    let prompt = session.gettext('choose-category-prompt');
    let choices = categoryChoices;
    let choicesValue = choices.map((choice) => {
      return choice.toLowerCase();
    })

    let promptMsg = createCardWithButtons(session, prompt, choicesValue, choices)
    
    builder.Prompts.text(session, promptMsg);

  },
  // parse productName
  (session, results, next) => {
    let nextDialog = results.response;
    
    session.beginDialog(nextDialog);
  },
  (session, results, next) => {
    // more options
    let options = [
      'News',
      'Recommedations',
      // more things
      'Check stock',
      'Create appointment'
    ];
    // session.send('back on welcome');
    let text = session.gettext('choose-options');
    session.send(createButtonsMessage(session, text, options));
    console.log(results);
  }
]

let sneakers = [
  (session, results, next) => {
    let promptName = session.gettext('sneakers-prompt-name');
    builder.Prompts.text(session, promptName);
  },
  (session, results, next) => {
    let sneakersName = results.response;
    session.privateConversationData.name = sneakersName;
    
    let sizePromptMsg = session.gettext('size-prompt')
    builder.Prompts.number(session, sizePromptMsg);
  },
  (session, results, next) => {
    let size = results.response;

    session.privateConversationData.size = size;
    let sneakersName = session.privateConversationData.name;
    
    // check stock
    let sneakersNameEncoded = encodeURI(sneakersName);

    api.checkStock(sneakersNameEncoded, size, (response) => {
      response = response || [];

      let stores = {};
      for(store of response) {
        stores[store.store_name] = store;
      }

      session.privateConversationData.stores = stores;
      
      // generate list of options
      let choices = response.map((store) => {
        // return new builder.Message(session)
        return `${store.store_name}, ${store.store_location}`;
      })
      let choicesValue = response.map((store) => {
        // return new builder.Message(session)
        return store.store_name;
      });

      if(choices.length < 1) {
        return session.endDialog('no-stock-anywhere');
      }
      
      let image = new builder.CardImage().url(/*`${APP_BASE_URL}/${*/response[0].imageUrl/*}`*/);
      let imageMsg = new builder.HeroCard()
        .images([image])
        .title(sneakersName);
      let msg = new builder.Message()
        .addAttachment(imageMsg);
      session.send(msg);

      let storeChoicesPrompt = session.gettext('store-choices-prompt');
      let choiceMsg = createCardWithButtons(session, storeChoicesPrompt, choicesValue, choices);

      // builder.Prompts.choice(session, choiceMsg, choices);
      builder.Prompts.text(session, choiceMsg);

    })
  },
  (session, results, next) => {
    let store = session.privateConversationData.stores[results.response];
    session.privateConversationData.store = store;
    
    session.send('store-selected');
    let timerangeChoicesPrompt = session.gettext('timerange-choices-prompt');

    let promptMsg = createCardWithButtons(session, timerangeChoicesPrompt, store.timerange, store.timerange);
    builder.Prompts.text(session, promptMsg);
  },
  (session, results, next) => {
    let timerange = results.response;

    session.privateConversationData.timerange = timerange;

    // post appointment

    let {store_id, product_id} = session.privateConversationData.store;

    api.arrangeAppointment(product_id, 5, store_id, (appointmentId) => {
      session.privateConversationData.appointments = session.privateConversationData.appointments ? session.privateConversationData.appointments : [];
      session.privateConversationData.appointments.push(appointmentId);

      setTimeout(() => {
        // TODO: card apointment reminder
        session.send('APPOINTMENT REMINDER');
      }, 1000*SECONDS_DELAY_MSG);

      let successMsg = session.gettext('appointment-created-success', timerange);
      session.endDialog(successMsg);
    })
    
  }
];

let clothes = [
  (session, results, next) => {
    session.send('clothes-welcome');
    let promptName = session.gettext('clothes-prompt-name');
    builder.Prompts.text(session, promptName);
  },
  (session, results, next) => {
    let clotheName = results.response;
    session.privateConversationData.name = clotheName;
    
    let sizePromptMsg = session.gettext('size-prompt')
    builder.Prompts.text(session, sizePromptMsg);
  },
  (session, results, next) => {
    let size = results.response;

    session.privateConversationData.size = size;
    let clothesName = session.privateConversationData.name;
    
    // check stock
    clothesNameEncoded = encodeURI(clothesName);

    api.checkStock(clothesNameEncoded, size, (response) => {
      response = response || [];

      session.privateConversationData.stores = response;
      
      // generate list of options
      let choices = response.map((store) => {
        // return new builder.Message(session)
        let hc = new builder.HeroCard()
          .title(`${store.store_name}, ${store.store_location}`)
          // .images([new builder.CardImage().url(store.imageUrl)])

        return hc;
      })

      if(choices.length < 1) {
        return session.endDialog('no-stock-anywhere');
      }

      let image = new builder.CardImage().url(/*`${APP_BASE_URL}/${*/response[0].imageUrl/*}`*/);
      let imageMsg = new builder.HeroCard()
        .images([image])
        .title(clothesName);
      let msg = new builder.Message()
        .addAttachment(imageMsg);
      session.send(msg);

      let listMsg = new builder.Message()
        .attachments(choices)
        // .attachmentLayout(builder.AttachmentLayout.carousel)
      
      session.send(listMsg);
      session.endDialog();
    })
  },
];


let recomendations = [
  (session, results, next) => {

  }
]

let imagescanner = [
  (session, results, next) => {
    let promptAttachment = session.gettext('prompt-attachment');
    builder.Prompts.attachment(session, promptAttachment);
  },
  (session, results, next) => {
    console.log(results);
    let url = (results.response && (results.response.length > 0) && results.response[0].contentUrl)
      ? results.response[0].contentUrl : '';

    let stream = vision.getImageStreamFromMessage(session.message);
    api.recognizeSneakerStream(stream, (name) => {
      console.log('NAME');
      console.log(name);
      session.send('GREAT ' + name + '!');
    })
  }
]

module.exports = {
  welcome,
  sneakers,
  clothes,
  recomendations,
  imagescanner
};
