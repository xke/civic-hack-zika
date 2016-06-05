const request = require('request'),
      express = require('express'),
      bodyParser = require('body-parser');

const app = express();

const VERIFY_TOKEN = process.env.FB_MESSENGER_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.FB_MESSENGER_PAGE_ACCESS_TOKEN;

const PAYLOADS = {
  TOP_LEVEL_LEARN: 'TOP_LEVEL_LEARN',
  TOP_LEVEL_FIND: 'TOP_LEVEL_FIND',
  TOP_LEVEL_NEWS: 'TOP_LEVEL_NEWS'
};

const linkButton = (title, url) => ({ 'type': 'web_url', url, title });
const postbackButton = (title, payload) => ({ 'type': 'postback', title, payload });

const sendMessage = (sender, message) => {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: {
      recipient: { id: sender },
      message,
    }
  }, (error, response, body) => {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
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

const handleIncomingText = (sender, text) => {
  switch (text) {
    case PAYLOADS.TOP_LEVEL_LEARN:
      sendButtonsMessage('Learn about Zika', [
        postbackButton('What are symptoms?', ''),
        postbackButton('How to prevent?', ''),
        postbackButton('What are risks?', ''),
        postbackButton('How does it spread?', ''),
        postbackButton('How did it appear?', ''),
      ]);
      break;
    case PAYLOADS.TOP_LEVEL_FIND:
      sendButtonsMessage('Where is Zika?', [
        linkButton('Map of cases', 'https://dfranquesa.shinyapps.io/Civic-hack-zika/')
      ]);
      break;
    case PAYLOADS.TOP_LEVEL_NEWS:
      sendButtonsMessage('Latest news', [
        linkButton('Search Twitter', 'https://twitter.com/search?q=Zika')
      ]);
      break;
  }
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
    if (event.message && event.message.text) {
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
});
