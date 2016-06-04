const request = require('request'),
      express = require('express'),
      app = express();

let VERIFY_TOKEN = process.env.FB_MESSENGER_VERIFY_TOKEN;
var PAGE_ACCESS_TOKEN = process.env.FB_MESSENGER_PAGE_ACCESS_TOKEN;

const sendTextMessage = (sender, text) => {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: {text},
    }
  }, (error, response, body) => {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
};

/*
 * Webhooks API endpoints
 */

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
      let text = event.message.text;
      sendTextMessage(sender, text);
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
