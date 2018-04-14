const builder = require('botbuilder');
const api = require('../router');

const categoryChoices = [ 'Sneakers', 'Clothes' ];

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

let welcome = [
  (session, results, next) => {
    // send welcome to the user
    session.send('welcome');
    
    // choose sneakers || clothes
    let prompt = session.gettext('choose-category-prompt');
    let choices = categoryChoices;
    builder.Prompts.choice(session, prompt, choices, {listStyle: builder.ListStyle.button});

  },
  // parse productName
  (session, results, next) => {
    console.log(results);
    let optionChoosed = results.response.index;

    let nextDialog;
    switch(optionChoosed) {
      case 1:
        nextDialog = 'clothes';
        break;
      case 0:
      default:
        nextDialog = 'sneakers';
        break
    }
    session.beginDialog(nextDialog);
  },
  (session, results, next) => {
    session.send('back on welcome');
    console.log(results);
  }
]

let sneakers = [
  (session, results, next) => {
    session.send('sneakers-welcome');
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

      session.privateConversationData.stores = response;
      
      // generate list of options
      let choices = response.map((store) => {
        // return new builder.Message(session)
        return store.store_name;
      })

      if(choices.length < 1) {
        return session.endDialog('no-stock-anywhere');
      }

      
      let image = new builder.CardImage().url(response[0].imageUrl);
      let imageMsg = new builder.HeroCard()
        .images([image])
        .title(sneakersName);
      session.send(imageMsg);

      let storeChoicesPrompt = session.gettext('store-choices-prompt');
      builder.Prompts.choice(session, storeChoicesPrompt, choices, {listStyle: builder.ListStyle.button});

    })
    

  },
  (session, results, next) => {
    let store = session.privateConversationData.stores[results.response.index];
    session.privateConversationData.store = store;

    let timerangeChoicesPrompt = session.gettext('timerange-choices-prompt');
    builder.Prompts.choice(session, timerangeChoicesPrompt, store.timerange, {listStyle: builder.ListStyle.button});
  },
  (session, results, next) => {
    let timerange = results.response.index;

    session.privateConversationData.timerange = timerange;

    // post appointment

    let {store_id, product_id} = session.privateConversationData.store;

    api.arrangeAppointment(product_id, 5, store_id, (appointmentId) => {
      session.privateConversationData.appointments = session.privateConversationData.appointments ? session.privateConversationData.appointments : [];
      session.privateConversationData.appointments.push(appointmentId);
      session.endDialog('APPOINTMENT CREATED');
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
    // check stock

    let response = defaultStock;
    // response
    response = response || [];
    session.privateConversationData.stores = response;
    
    // generate list of options
    let choices = response.map((store) => {
      // return new builder.Message(session)

      // let card = new builder.HeroCard
      return store.name;
    })

    let storeChoicesPrompt = session.gettext('store-choices-prompt');
    // builder.Prompts.choice(session, storeChoicesPrompt, choices, {listStyle: builder.ListStyle.button});

    session.send(choices.toString());

    session.endDialog('NOTHING MORE TO DO');

  },
]

module.exports = {
  welcome,
  sneakers,
  clothes
};
