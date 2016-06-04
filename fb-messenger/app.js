let express = require('express'),
    app = express();

let VERIFY_TOKEN = process.env.FB_MESSENGER_VERIFY_TOKEN;

app.get('/', (req, res) => {
  res.send('This provides the endpoints for the Civic Hack Zika FB Messenger UI.');
});

app.get('/fb-messenger-api/webhook/', (req, res) => {
  let result = 'Error, wrong validation token';
  if (VERIFY_TOKEN && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    result = req.query['hub.challenge'];
  }
  res.send(result);
});

let server = app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  let port = server.address().port;
  console.log('App listening on port: ' + port);
});
