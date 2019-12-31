'use strict';

// {
//   "time": 1567792089082,
//   "summary": "Foggy in the morning."
// },
const weatherStuff = [];

function Weather(obj){
  this.time = new Date(obj.time);
  this.forecast = obj.summary;

  weatherStuff.push(this);
}

Weather.prototype.render = function(){
  let source = $('#weather-results-template').html();
  let template = Handlebars.compile(source);
  return template(this);
}

$.get('city-weather-data.json', weather => {
  // console.log(data);
  weather.data.forEach(day => {
    // console.log(day);
    $('#weather-container').append(new Weather(day).render());
  })
})



  // render using handlebars
  // append to the page

