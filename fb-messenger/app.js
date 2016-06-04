let express = require('express'),
    app = express();

app.get('/', (req, res) => {
  res.send('This provides the endpoints for the Civic Hack Zika FB Messenger UI.');
});

let server = app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  let port = server.address().port;
  console.log('App listening on port: ' + port);
});
