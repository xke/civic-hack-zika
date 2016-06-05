const request = require('request'),
      express = require('express'),
      bodyParser = require('body-parser');

const app = express();

/*
 * App constants
 */

const VERIFY_TOKEN = process.env.FB_MESSENGER_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.FB_MESSENGER_PAGE_ACCESS_TOKEN;

const PAYLOADS = {
  TOP_LEVEL_LEARN: 'TOP_LEVEL_LEARN',
  TOP_LEVEL_FIND: 'TOP_LEVEL_FIND',
  TOP_LEVEL_NEWS: 'TOP_LEVEL_NEWS',
  LEARN_SYMPTOMS: 'LEARN_SYMPTOMS',
  LEARN_PREVENT: 'LEARN_PREVENT',
  LEARN_TREAT: 'LEARN_TREAT'
};

/*
 * Utility functions
 */

const linkButton = (title, url) => ({ 'type': 'web_url', url, title });
const postbackButton = (title, payload) => ({ 'type': 'postback', title, payload });

const postForPage = (url, json) => {
  request({
    url,
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json
  }, (error, response, body) => {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
};

const sendMessage = (sender, message) => {
  postForPage('https://graph.facebook.com/v2.6/me/messages', {
    recipient: { id: sender },
    message,
  });
};

const sendTextMessage = (sender, text) => sendMessage(sender, { text });

const sendButtonsMessage = (sender, text, buttons) => {
  sendMessage(sender, {
    attachment: {
      type: 'template',
      payload: { 'template_type': 'button', text, buttons }
    }
  });
};

/*
 * Handlers
 */

const topLevelButtons = [
  postbackButton('Learn about Zika', PAYLOADS.TOP_LEVEL_LEARN),
  postbackButton('Where is Zika?', PAYLOADS.TOP_LEVEL_FIND),
  postbackButton('Latest news', PAYLOADS.TOP_LEVEL_NEWS)
];

const handleIncomingPostback = (sender, payload) => {
  console.log("Handling incoming postback: " + payload);
  switch (payload) {
    case PAYLOADS.TOP_LEVEL_LEARN:
      sendButtonsMessage(sender, 'Learn about Zika', [
        postbackButton('What are symptoms?', PAYLOADS.LEARN_SYMPTOMS),
        postbackButton('How to prevent?', PAYLOADS.LEARN_PREVENT),
        postbackButton('How to treat?', PAYLOADS.LEARN_TREAT)
      ]);
      break;
    case PAYLOADS.TOP_LEVEL_FIND:
      sendButtonsMessage(sender, 'Where is Zika?', [
        linkButton('Map of cases', 'https://dfranquesa.shinyapps.io/Civic-hack-zika/')
      ]);
      break;
    case PAYLOADS.TOP_LEVEL_NEWS:
      sendButtonsMessage(sender, 'Latest news', [
        linkButton('Search Twitter', 'https://twitter.com/search?q=Zika'),
        linkButton('Search Facebook', 'https://www.facebook.com/search/top/?q=zika')
      ]);
      break;
    case PAYLOADS.LEARN_SYMPTOMS:
      sendTextMessage(sender,
        "Symptoms can include fever, rash, joint pain, and red eyes. Most people infected with Zika don't develop " +
        "symptoms, and don’t have to be hospitalized. A Zika infection during pregnancy can cause microcephaly, a " +
        "birth defect where a baby’s brain and head do not properly develop.");
      break;
    case PAYLOADS.LEARN_PREVENT:
      sendTextMessage(sender,
        'No vaccines currently exist to prevent Zika. You can reduce your risks by protecting yourself from ' +
        'mosquito bites, since virus-infected mosquitoes are the primary way that Zika gets transmitted. Using ' +
        'insect repellant is one great way to prevent mosquito bites. Clearing up mosquito-breeding sites like ' +
        'trash or standing water can also be effective.');
      break;
    case PAYLOADS.LEARN_TREAT:
      sendTextMessage(sender,
        'No special medicine currently exists for Zika. You can treat the symptoms by getting plenty of rest and ' +
        'drinking fluids. Zika usually remains in the blood of an infected person for about a week, but it can be ' +
        'found longer in some people. An infected person is likely to develop immunity from Zika and be protected ' +
        'from future infections.');
      break;
  }
};

const handleIncomingText = (sender, text) => {
  console.log("Handling incoming text: " + text);
};

/*
 * Webhooks API endpoints
 */

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('This provides the endpoints for the Civic Hack Zika FB Messenger UI.');
});

app.get('/fb-messenger-webhook/', (req, res) => {
  let result = 'Error, wrong validation token';
  if (VERIFY_TOKEN && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    result = req.query['hub.challenge'];
  }
  res.send(result);
});

app.post('/fb-messenger-webhook/', (req, res) => {
  const messaging_events = req.body.entry[0].messaging;

  for (let i = 0; i < messaging_events.length; i++) {
    let event = req.body.entry[0].messaging[i],
        sender = event.sender.id;
    if (event.postback && event.postback.payload) {
      handleIncomingPostback(sender, event.postback.payload);
    } else if (event.message && event.message.text) {
      handleIncomingText(sender, event.message.text);
    }
  }

  res.sendStatus(200);
});

/*
 * Start server
 */

let server = app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  let port = server.address().port;
  console.log('App listening on port: ' + port);

  postForPage('https://graph.facebook.com/v2.6/1732597967012712/thread_settings', {
    setting_type: 'call_to_actions',
    thread_state: 'new_thread',
    call_to_actions: [{
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [{
              title: 'Civic Hack Zika',
              item_url: 'https://dfranquesa.shinyapps.io/Civic-hack-zika/',
              image_url: 'https://z-1-scontent-sjc2-1.xx.fbcdn.net/v/t1.0-9/13330963_1732598180346024_1321225047963306710_n.jpg?oh=fabdc0e38893bb838302268bb52622bc&oe=57D22806',
              subtitle: 'Learn about Zika, and find out where it is.',
              buttons: topLevelButtons
            }]
          }
        }
      }
    }]
  });
});
