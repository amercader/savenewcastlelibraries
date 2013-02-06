$(document).ready(function(){

  var getParameterByName = function(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)')
                        .exec(window.location.search);
    return match ?
           decodeURIComponent(match[1].replace(/\+/g, ' '))
           : null;
    }

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

  var popupIMDContent = "<div>" +
  "{{#properties.imd}}" +
  "<div>IMD 2010 (Overall): {{properties.imd}}</div>" +
  "{{/properties.imd}}" +
  "{{^properties.imd}}" +
  "<div>IMD 2010 (Overall): No data</div>" +
  "{{/properties.imd}}" +
  "{{#properties.imd_edu}}" +
  "<div>IMD 2010 (Education, Skills and Training): {{properties.imd_edu}}</div>" +
  "{{/properties.imd_edu}}" +
  "{{^properties.imd_edu}}" +
  "<div>IMD 2010 (Education, Skills and Training): No data</div>" +
  "{{/properties.imd_edu}}" +
  "<div>LSOA Id: {{properties.lsoa}}</div>" +
  "</div>";

  var popupIMDTemplate = Mustache.compile(popupIMDContent);

  var resize = function(){
    $("#map").height($(document).height());
  };
  resize();
  $(window).resize(resize);

  var map = L.map('map').setView([55, -1.59], 12);
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
  $.getJSON('data/ncl-council-libraries.geojson', function (data) {
    L.geoJson(data, {
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
  });

  var currentLayer = getParameterByName("l") || "imd";
  var getIMDColor = function(value) {
    /*
     * Natural Breaks (Jenks) for 7 classes, calculated on QGIS
     * Colors by http://colorbrewer2.org
     * */
    layer = currentLayer || "imd";
    var series = {
      "imd": {
        "breaks": [58.52, 47.6, 36.53, 26, 15.72, 5.77, 2.32],
        "colors": ["#99000D", "#CB181D", "#EF3B2C", "#FB6A4A", "#FC9272", "#FCBBA1", "#FEE5D9" ]
      },
      "imd_edu": {
        "breaks": [74.36, 60.21, 47.82, 33.97, 20.39, 7.88, 0.88],
        "colors": ["#99000D", "#CB181D", "#EF3B2C", "#FB6A4A", "#FC9272", "#FCBBA1", "#FEE5D9" ]
      }
    }


    for (var i=0; i < series[layer]["breaks"].length; i++){
      if (value > series[layer]["breaks"][i]){
        return series[layer]["colors"][i];
      }
    }
    return "#FFFFFF";
  }

  var getIMDStyle = function(feature) {

    return {
      color: '#666',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.5,
      fillColor: (feature.properties) ?
        getIMDColor(feature.properties[currentLayer]) :
        null
    }
  };

  var lsoaLayer = L.geoJson(null, {
    style: getIMDStyle,
    onEachFeature: function(feature, layer){
      if (feature.properties) {
        layer.bindPopup(popupIMDTemplate(feature));
      }
    }

  }).addTo(map);

  $.getJSON('data/lsoa-imd.topojson', function (data) {
    var lsoaGeojson = topojson.object(data, data.objects["lsoa-imd"]);

    var featureCollection = {
      "type": "FeatureCollection",
      "features": []
    };

    // We need to translate the output of topojson to a FeatureCollection to
    // preserve the properties
    for (var i = 0; i < lsoaGeojson.geometries.length; i++) {
      featureCollection.features.push({
        "type":"Feature",
        "geometry": lsoaGeojson.geometries[i],
        "properties": lsoaGeojson.geometries[i].properties
      });
    }

    lsoaLayer.addData(featureCollection);
  });

  var showInfo = !(getParameterByName("info") == "false");

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

        if (showInfo) {
          $("#notes").show();
        } else {
          $("#notes-show").show();
        }

        $("#layer-" + currentLayer).attr("checked", true);
        $(".layers input").click(function(){
          currentLayer = $(this).data("layer");
          if (currentLayer == "none") {
            map.removeLayer(lsoaLayer);
          } else {
            if (!map.hasLayer(lsoaLayer)){
              map.addLayer(lsoaLayer);
            } else {
              lsoaLayer.setStyle(getIMDStyle);
            }
          }
        });


        $(container).append($("#notes-show"));
        $(container).append($("#notes"));

        return container;
    }
  });

  map.addControl(new NotesContainer());

});
