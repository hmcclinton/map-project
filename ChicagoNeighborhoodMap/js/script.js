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
				radius: 1500,
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

	////*Places markers on map with green pin
	function createPinpoint(place) {
		var marker = new google.maps.Marker({
			map: map,
			icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
			name: place.name.toLowerCase(),
			position: place.geometry.location,
			place_id: place.place_id,
			animation: google.maps.Animation.DROP
		});
		var address;
		if (place.vicinity !== undefined) {
			address = place.vicinity;
		}
		var informationString =
			"<div>" +
			place.venueName +
			"</div><div>" +

			////*Bounce when clicked on menu bar
			google.maps.event.addListener(marker, "click", function() {
				var marker = this;
				self.getfoursquareInformation(marker, infowindow);
				map.panTo(marker.position);
				marker.setAnimation(google.maps.Animation.BOUNCE);
				setTimeout(function() {
					marker.setAnimation(google.maps.Animation.BOUNCE);
				}, 5000);
			});
		pinmarkerArray.push(marker);
		return marker;
	};
	self.makeinformationString = function(data) {
		return "<h3>" + data.foursquareName + "</h3>";
	};

	////*Pinmarker marker is opened when click on red pins
	self.clickPinpoint = function(place) {
		google.maps.event.trigger(place.marker, "click");
	};

	////*Foursquare credentials from developers Foursquare
	this.foursquareData = "";
	var clientID = "HIOCM5BTLUGKHFWCYUZV0YAH3NBC2TJSFYQPSUN4SWJI5XJG";
	var clientSecret = "QS3LTEDZPNU53KO2GESRRXVNBS5TRHNP0LOSHACCNNL35HML";
	this.getfoursquareInformation = function(marker, infowindow) {
		var longlat = marker.position.lat() + "," + marker.position.lng();
		var foursquare =
			"https://api.foursquare.com/v2/venues/search?ll=" +
			longlat +
			"&client_id=HIOCM5BTLUGKHFWCYUZV0YAH3NBC2TJSFYQPSUN4SWJI5XJG&client_secret=QS3LTEDZPNU53KO2GESRRXVNBS5TRHNP0LOSHACCNNL35HML&v=20171211";
		$.getJSON(foursquare).done(function(response) {

			////*Information that foursquare will display
			this.foursquareData = "Foursquare Information: <br>";
			var venue = response.response.venues[0];
			var venueName = venue.name;
			if (venueName !== null && venueName !== undefined) {
				this.foursquareData += "Name: " + venueName + "<br>";
			}
			var phoneNumber = venue.contact.formattedPhone;
			if (phoneNumber !== null && phoneNumber !== undefined) {
				this.foursquareData += "Phone: " + phoneNumber + "<br>";
			}
			var twitterFeed = venue.contact.twitter;
			if (twitterFeed !== null && twitterFeed !== undefined) {
				this.foursquareData += "Twitter: " + twitterFeed + "<br>";
			}
			var statsVenue = venue.stats.checkinsCount;
			if (statsVenue !== null && statsVenue !== undefined) {
				this.foursquareData += "Checkin Count: " + statsVenue + "<br>";
			}
			var venueRating = venue.rating;
			if (venueRating !== null && venueRating !== undefined) {
				this.foursquareData += "Rating: " + venueRating + "<br>";
			}
			var contentData = {
				foursquareName: this.foursquareData
			};
			var informationString = self.makeinformationString(contentData);
			infowindow.setContent(informationString);
			infowindow.open(map, marker);
		})

		////*Fails from Foursquare // made correction per review verified now bounces
		.fail(function() {
			alert("\nErrors\n\nFoursquare is not responding correctly");
		});
	};

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
