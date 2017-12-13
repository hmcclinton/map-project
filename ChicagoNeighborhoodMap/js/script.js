////*Define variables
var appViewModel;
var pinmarkerArray = [];
function AppViewModel() {
  var self = this;
  var map;
  var service;
  var infowindow;
  var latitude = "";
  var longitude = "";
  var hotelsChicago;

  self.allPlaces = ko.observableArray([]);
  self.search = ko.observable("");

////*Map Centerpoint
  function centerPoint() {
    var latitudeAndLongitude = map.getCenter();
    latitude = latitudeAndLongitude.lat();
    longitude = latitudeAndLongitude.lng();
  }

////*Initialize map
  self.initialize = function() {
    hotelsChicago = new google.maps.LatLng(41.881832, -87.623177);
    map = new google.maps.Map(document.getElementById("map-canvas"), {
      center: hotelsChicago
    });
    showHotels();
    centerPoint();

////*List of hotels in Downtown Chicago
    var inputs = document.getElementById("inputs");
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(inputs);
    function showHotels() {
      var display = {
        location: hotelsChicago,
        radius: 2500,
        types: ["Hotels"]
      };
      infowindow = new google.maps.InfoWindow();
      service = new google.maps.places.PlacesService(map);
      service.nearbySearch(display, loop);
    }

////* Credit https://developers.google.com/maps/documentation/javascript/places
    function loop(results, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        bounds = new google.maps.LatLngBounds();
        results.forEach(function(place) {
          bounds.extend(
            new google.maps.LatLng(
              place.geometry.location.lat(),
              place.geometry.location.lng()
            )
          );
        });
        map.fitBounds(bounds);
        results.forEach(getAllHotels);
      }
    }

////*Map fails to load in timely manner
    var errormsg = window.setTimeout(3000);
    google.maps.event.addListener(map, "tilesloaded", function() {
      window.clearTimeout(errormsg);
    });
  };

////*Places markers on map with red dot
  function createPinpoint(place) {
    var marker = new google.maps.Marker({
      map: map,
      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      name: place.name.toLowerCase(),
      position: place.geometry.location,
      place_id: place.place_id,
      animation: google.maps.Animation.DROP
    });

////*Bounce when clicked on menu bar
    google.maps.event.addListener(marker, "click", function() {
      var marker = this;
      map.panTo(marker.position);
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        marker.setAnimation(null);
      }, 5000);
    });
    pinmarkerArray.push(marker);
    return marker;
 };

////*Pinmarker marker is opened when click on red pins
  self.clickPinpoint = function(place) {
    google.maps.event.trigger(place.marker, "click");
  };

////*Yelp credentials
// client id = ZzO792cf2U7CbIHlTu0R6A
// api key = nmQYwwBeOW3veOAJgzbrjtsMHA2RsoT0zZwTV08AhI4SAcq0sIPhRFPPID0q3g0IZdSdFmzGJoLuVvx0K-RwIXhFmIWpstO9BLOSQYLYln93-x5Hn7TnEhmKqZkuWnYx
// client secret = IrMkIVUjtNusvZkaSop1sUZTRHP2iiv50Ra2Dumvs1J3CS1PI5rQ7hrz5y2uZA2b
// url = GET https://api.yelp.com/v3/businesses/search

////*Hotels in chicago are listed
  function getAllHotels(place) {
    var chicagoHotels = {};
    chicagoHotels.place_id = place.place_id;
    chicagoHotels.position = place.geometry.location.toString();
    chicagoHotels.name = place.name;
    var address;
    if (place.vicinity !== undefined) {
      address = place.vicinity;
    } else if (place.formatted_address !== undefined) {
      address = place.formatted_address;
    }
    chicagoHotels.marker = createPinpoint(place);
    chicagoHotels.address = address;
    self.allPlaces.push(chicagoHotels);
  }

////*Search menu (can search for listed items by name)
  self.menuList = ko.computed(function() {
    var userSearch = self.search().toLowerCase();
    var listed = [];
    self.allPlaces().forEach(function(place, index) {
      var name = place.name.toLowerCase();
      var nameAndUserSearchMatch = name.indexOf(userSearch) >= 0;
      if (nameAndUserSearchMatch) listed.push(place);
      if (pinmarkerArray[index].place_id === place.place_id)
        pinmarkerArray[index].setVisible(nameAndUserSearchMatch);
    });
    return listed;
  });
}

////*Error function googleError for map loading
function googleError() {
  alert("Error Loading Google Maps");
}

////*KO
appViewModel = new AppViewModel();
ko.applyBindings(appViewModel);
