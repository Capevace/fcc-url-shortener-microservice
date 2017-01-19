const express = require('express');
const app = express();
const shorthash = require('shorthash').unique;
const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL);

sequelize
  .authenticate()
  .then(function(err) {
    console.log('Connection has been established successfully.');
  })
  .catch(function (err) {
    console.log('Unable to connect to the database:', err);
  });


var Url = sequelize.define('url', {
  key: Sequelize.STRING,
  url: Sequelize.STRING
});

sequelize.sync();

app.set('port', (process.env.PORT || 5000));

// check if we are on heroku and set hostadress accordingly
app.set('hostaddress', process.env.PORT
  ? 'https://fcc-mat-url-shortener.herokuapp.com'
  : 'localhost:5000'
);

app.get('/new/*', (req, res) => {
  const url = req.params[0];
  console.time('Response:');

  // Check if an entry with that url already exists
  // then just return that one.
  Url.findOne({ where: { url } })
    .then(urlEntry => {
      if (urlEntry) {
        res.json({
          original_url: urlEntry.dataValues.url,
          short_url: app.get('hostaddress') + '/' + urlEntry.dataValues.key
        });
        console.timeEnd('Response:');
      } else {
        // If it doesnt exist, then generate a hash from the url
        // and create a new one.
        const key = shorthash(url);
        Url.create({ url, key})
          .then(newUrlEntry => {
            res.json({
              original_url: newUrlEntry.dataValues.url,
              short_url: app.get('hostaddress') + '/' + newUrlEntry.dataValues.key
            });
            console.timeEnd('Response:');
          });
      }
    });
});

app.get('/:key', (req, res) => {
  Url
    .findOne({ where: { key: req.params.key } })
    .then((urlEntry) => {
      if (!urlEntry) {
        res.sendStatus(404);
      } else {
        res.redirect(urlEntry.dataValues.url);
      }
    });
});

app.listen(app.get('port'), () => {
  console.log('Url shortener listening on port:', app.get('port'));
});
