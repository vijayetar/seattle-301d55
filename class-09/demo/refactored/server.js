'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const pg = require('pg');
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

// Application Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

// Route Definitions
app.get('/location', locationHandlerOriginal);
// app.get('/location', locationHandlerRefactored);
app.get('/weather', weatherHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

// START

function locationHandlerOriginal(request, response) {

  const city = request.query.city;

  let SQL = 'SELECT * FROM locations WHERE search_query = $1';
  let values = [city];

  client.query(SQL, values)
    .then(results => {
      if (results.rowCount) {
        console.log(results.rows[0]);
        response.status(200).json(results.rows[0]);
      }
      else {
        let key = process.env.GEOCODE_API_KEY;
        const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
        superagent.get(url)
          .then((results) => {
            let SQL = `
                INSERT INTO locations (search_query, formatted_query, latitude, longitude)
                VALUES ($1, $2, $3, $4)
                RETURNING *
              `;
            let locationData = results.body[0];
            let values = [city, locationData.display_name, locationData.lat, locationData.lon];
            return client.query(SQL, values)
              .then(results => results.rows[0]);
          })
          .then(savedLocation => response.status(200).json(savedLocation))
          .catch(error => errorHandler(error, request, response));
      }
    });
}


// REFACTOR: Location Handler, calls helper functions now
function locationHandlerRefactored(request, response) {
  const city = request.query.city;
  getLocationData(city)
    .then(data => render(data, response))
    .catch((error) => errorHandler(error, request, response));
}

function getLocationData(city) {

  let SQL = 'SELECT * FROM locations WHERE search_query = $1';
  let values = [city];

  return client.query(SQL, values)
    .then(results => {
      if (results.rowCount) { return results.rows[0]; }
      else {
        let key = process.env.GEOCODE_API_KEY;
        const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
        return superagent.get(url)
          .then(data => cacheLocation(city, data.body));
      }
    });
}

function cacheLocation(city, data) {
  const location = new Location(data[0]);
  let SQL = `
    INSERT INTO locations (search_query, formatted_query, latitude, longitude)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  let values = [city, location.formatted_query, location.latitude, location.longitude];
  return client.query(SQL, values)
    .then(results => results.rows[0]);
}

function Location(data) {
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

// HOW SHULD WE REFACTOR:
//  What are our pain points here?
//  Where can we extract logic for this (and any other "normal" API")
function weatherHandler(request, response) {

  let { latitude, longitude } = request.query;

  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${latitude},${longitude}`;

  superagent.get(url)
    .then(data => {
      const weatherSummaries = data.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.status(200).json(weatherSummaries);
    })
    .catch((error) => {
      errorHandler(error, request, response);
    });

}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function render(data, response) {
  response.status(200).json(data);
}

function notFoundHandler(request, response) {
  response.status(404).send('huh?');
}

function errorHandler(error, request, response) {
  response.status(500).send(error);
}

function startServer() {
  app.listen(PORT, () => console.log(`Server up on ${PORT}`));
}

// Start Up the Server after the database is connected and cache is loaded
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));
client.connect()
  .then(startServer)
  .catch(err => console.error(err));
