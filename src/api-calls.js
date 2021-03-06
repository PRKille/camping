import { TrailService } from './trail-service.js';
import { GeoService } from './geo-service.js';
import { WeatherService } from './weather-service.js';
import $ from 'jQuery';

export function apiCalls(location) {
  const trailService = new TrailService();
  const geoService = new GeoService();
  const weatherService = new WeatherService();
  $("#trail-info").on('click', 'li', function() {
    let currentTrail= $(this).val();
    (async () => {
      let currentTrailResponse = await trailService.getTrailByID(currentTrail);
      if (currentTrailResponse.trails.length === 0) {
        $("#more-info h3").html("Whoops, there was an error displaying more information about this trail.");
      } else if (currentTrailResponse.trails.length > 0) {
        $("#more-info h3").html(`${currentTrailResponse.trails[0].name}`);
        let summary;
        if (currentTrailResponse.trails[0].summary === "Needs Adoption" || currentTrailResponse.trails[0].summary === "Needs Summary"|| currentTrailResponse.trails[0].summary === "Needs Adoption!") {
          summary = "unavailable";
        } else {
          summary = currentTrailResponse.trails[0].summary;
        }
        $("#more-info ul").html(`<li>Location: ${currentTrailResponse.trails[0].location}</li><li>Difficulty: ${currentTrailResponse.trails[0].difficulty}</li><li>Ascent: ${currentTrailResponse.trails[0].ascent}</li><li>Descent: ${currentTrailResponse.trails[0].descent}</li>`);
        if (summary != "unavailable") {
          $("#more-info ul").append(`<li>Summary: ${summary}</li>`);
        }
      }
    })();
  });
  (async () => {
    let geoResponse = await geoService.getGeoByInput(location);
    let lat = geoResponse.results[0].geometry.lat;
    let lng = geoResponse.results[0].geometry.lng;
    let sunrise = geoResponse.results[0].annotations.sun.rise.apparent + geoResponse.results[0].annotations.timezone.offset_sec;
    let sunset = geoResponse.results[0].annotations.sun.set.apparent + geoResponse.results[0].annotations.timezone.offset_sec;
    // Weather Info
    (async () => {
      let weatherResponse = await weatherService.getWeatherByLoc(lat, lng);
      getWeather(weatherResponse, sunrise, sunset);
    })();
    // Trail Info
    (async () => {
      let radius = 20;
      let trailResponse = await trailService.getTrailInfoByLoc(lat, lng, radius);
      if (trailResponse.trails.length === 0) {
        radius += 80;
        let trailResponse = await trailService.getTrailInfoByLoc(lat, lng, radius);
        console.log(trailResponse.trails);
        if (trailResponse.length > 0) {
          getElements(trailResponse);
        } else {
          getElements(false);
        }
      } else {
        getElements(trailResponse);
      } 
    })();
  })();

  const getWeather = function(weatherResponse, sunrise, sunset) {
    $("h3#temp").html(`${weatherResponse.main.temp}°F`);
    $("#weather-info").html(`<h3>Current weather in ${location}:</h3><ul><li>Current temperature: ${weatherResponse.main.temp}°F ( feels like ${weatherResponse.main.feels_like}°F)</li><li>Humidity: ${weatherResponse.main.humidity}%</li><li>Conditions are ${weatherResponse.weather[0].main.toLowerCase()}.</li><li>Sunrise: ${getTime(sunrise)}<br>Sunset: ${getTime(sunset)}</li></ul>`);
  };
  const getElements = function(response) {
    const trailsArray = response.trails;
    if (response === false) {
      $("#trail-info").html("There are no trails found within 100 miles of your trip destination.");
    } else if (trailsArray) {
      trailsArray.sort(function(a, b) {
        return b.stars - a.stars;
      });
      for (let i=0; i<10; i++) {
        $("#trail-info ul").append(`<li value="${trailsArray[i].id}">${trailsArray[i].name}, ${trailsArray[i].length} miles</li>`);
      }
    } else {
      $("#trail-info").append("There was an error with your request. Please double-check your entries.");
    }
  };
}
const getTime = function(unicode) {
  let suntime = new Date(unicode *1000);
  let utcString = suntime.toUTCString();
  let time = utcString.slice(-12, -4);
  return time;
};

