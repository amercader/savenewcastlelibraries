$(document).ready(function(){

  var popupContent = "<div class='library'>" +
  "<h2>{{properties.name}}</h2>" +
  "<div class='plan box {{properties.plan}}'>{{properties.plan_msg}}</div>" +
  "</div>" +
  "<div class='feedback box'>" +
  "{{#properties.keep}}" +
  "<div>This library is not affected by the planned closures (yet), but are you concerned about the plans for other libraries in Newcastle?</div>" +
  "{{/properties.keep}}" +
  "{{^properties.keep}}" +
  "<p>Concerned about the plans for this library?</p>" +
  "{{/properties.keep}}" +
  "<div class='option'>" +
  "<h3>Get Involved</h3>" +
  "<div>Go to <a target='_blank' href='http://savenewcastlelibraries.org/'>SaveNewcastleLibraries.org</a> to sign the petition and find out more ways to help" +
  "</div>" +
  "<div class='option'>" +
  "<h3>Contact the local councillors for {{properties.ward_name}}</h3>" +
  "<ul>" +
  "{{#properties.councillors}}" +
  "<li><div>{{name}} (<i>{{party}}</i>)</div><div><a href='mailto:{{email}}?subject=Newcastle%20Libraries%20Closures'>{{email}}</a></div></li>" +
  "{{/properties.councillors}}" +
  "</ul>" +
  "</div>" +
  "<div class='option'>" +
  "<h3>Have your say on the <a target='_blank' href='http://www.letstalknewcastle.co.uk/surveys/page/249'>Budget 2016 Consultation</a> website</h3>" +
  "<div>(Expand <i>Local Services - Services People Access</i>, select proposal 9)</div>" +
  "</div>" +
  "<div class='option'>" +
  "<h3>Make yourself heard!</h3>" +
  "<ul>" +
  "<li>On Twitter <a target='_blank' href='https://twitter.com/search?q=%23savencllibraries'>#SaveNclLibraries</a></li>" +
  "<li>On Facebook <a target='_blank' href='https://www.facebook.com/SaveNewcastleLibraries'>SaveNewcastleLibraries</a></li>" +
  "</ul>" +
  "</div>" +
  "</div>";

  var popupTemplate = Mustache.compile(popupContent);

  var resize = function(){
    $("#map").height($(document).height());
  };
  resize();
  $(window).resize(resize);

  var map = L.map('map').setView([54.9789, -1.5664], 12);
  var mapUrl = "http://a.tiles.mapbox.com/v3/amercader.map-6wq525r7/{z}/{x}/{y}.png";

  var attribution = "Map data &copy; " + new Date().getFullYear() + " OpenStreetMap contributors, " + 
  "Tiles Courtesy of <a href='http://www.mapbox.com/' target='_blank'>MapBox</a>, " +
  "Map Icons by <a target='_blank' href='http://mapicons.nicolasmollet.com/'>Nicolas Mollet</a>";
  var bg = new L.TileLayer(mapUrl, {attribution: attribution ,subdomains: '1234'});
  map.addLayer(bg);

  var BaseIcon = L.Icon.extend({
      options: {
          iconSize:     [32, 37],
          iconAnchor:   [16, 37],
          popupAnchor:  [0, -20]
      }
  });

  L.geoJson(libraries, {
    onEachFeature: function(feature, layer){
      if (feature.properties) {
        feature.properties.keep = (feature.properties.plan == "keep");
        var msg;
        switch (feature.properties.plan){
          case "keep":
            msg = "Not affected";
            break;
          case "close":
            msg = "Closing on " + feature.properties.due;
            break;
          case "reduced":
            msg = "Reduced service";
            break;
          case "relocate":
            msg = "Relocated";
            break;
        };
        feature.properties.plan_msg = msg;

        layer.bindPopup(popupTemplate(feature),
          {"minWidth": 400});
      }
    },
    pointToLayer: function (feature, latLng) {
        return new L.Marker(latLng, {
          icon: new BaseIcon({
            iconUrl: "img/library-" + feature.properties.plan + ".png"
          })
        })
    }
  }).addTo(map);

  var NotesContainer = L.Control.extend({
    options: {
        position: 'topright'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'notes-container');
        $("#notes .box-close").click(function(){
          $("#notes").hide();
          $("#notes-show").show();
        });

        $("#notes-show>a").click(function(){
          $("#notes-show").hide();
          $("#notes").show();
        });

        $(container).append($("#notes-show"));
        $(container).append($("#notes").show());

        return container;
    }
  });

  map.addControl(new NotesContainer());

});
