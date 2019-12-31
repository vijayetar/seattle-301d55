'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

// Application Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

let locations = {};

// Route Definitions
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);


function locationHandler(request, response) {
  let city = request.query.city;
  let key = process.env.GEOCODE_API_KEY;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;

  if (locations[url]) {
    response.send(locations[url]);
  }
  else {
    superagent.get(url)
      .then(data => {
        const geoData = data.body[0]; // first one ...
        const location = new Location(city, geoData);
        locations[url] = location;
        response.send(location);
      })
      .catch(() => {
        errorHandler('So sorry, something went wrong.', request, response);
      });
  }
}

function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;
}


// http://localhost:3000/weather?latitude=47.6062095&longitude=-122.3320708
function weatherHandler(request, response) {

  let latitude = request.query.latitude;
  let longitude = request.query.longitude;
  // Alternatively: let {latitude, longitude} = request.query;
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${latitude},${longitude}`;

  superagent.get(url)
    .then(data => {
      const weatherSummaries = data.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.status(200).json(weatherSummaries);
    })
    .catch(() => {
      errorHandler('So sorry, something went wrong.', request, response);
    });

}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function notFoundHandler(request, response) {
  response.status(404).send('huh?');
}

function errorHandler(error, request, response) {
  response.status(500).send(error);
}


// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is listening on ${PORT}`));
