var map;
function init() {
    var adColumn = document.getElementById("ad-info");  // advertisment info column
    var map_div = document.getElementById("map");
    map_div.style.height = "800px";
    // map_div.style.height = "80%";  # it doesnt work this way
    map_div.style.width = "100%";
    
    // The overlay layer for our marker, with a simple diamond as symbol
    var overlay = new OpenLayers.Layer.Vector('Overlay', {
        styleMap: new OpenLayers.StyleMap({
            externalGraphic: 'static/img/marker.png',
            graphicWidth: 20, graphicHeight: 24, graphicYOffset: -24,
            title: '${tooltip}'
        })
    });
    
    var layerListeners = {
        featureclick: function(e) {
            log(e.object.name + " says: " + e.feature.id + " clicked.");
            return false;
        },
        nofeatureclick: function(e) {
            log(e.object.name + " says: No feature clicked.");
        }
    };
    
    var style = new OpenLayers.StyleMap({
        'default': OpenLayers.Util.applyDefaults(
            {label: "${l}", pointRadius: 10},
            OpenLayers.Feature.Vector.style["default"]
        ),
        'select': OpenLayers.Util.applyDefaults(
            {pointRadius: 10},
            OpenLayers.Feature.Vector.style.select
        )
    });
    
    // get markers
    var file_url = 'http://127.0.0.1:5000/data/'
    var file_text = httpGet(file_url);
    var items = csv2array(file_text, ",");
	items = items.slice(1, );
    var arrayLength = items.length;
    
	var coords_x_list = [];
	var coords_y_list = [];
    for (var i = 1; i < arrayLength; i++) {
        var row = items[i];
        var ad_url = row[1];
        var cost = row[2];
        var x = row[3];
        var y = row[4];
        coords_x_list.push(parseFloat(x));
        coords_y_list.push(parseFloat(y));
		
        var popupInfo = ad_url + "\n" + cost + " PLN";
        var currentLocation = new OpenLayers.Geometry.Point(y, x).transform('EPSG:4326', 'EPSG:3857');
        var layer1 = new OpenLayers.Feature.Vector(currentLocation, {
            tooltip: popupInfo,
            styleMap: style,
            eventListeners: layerListeners},
            );
        layer1.ad_url = ad_url;
        layer1.cost = cost;
        layer1.currentLocation = currentLocation;  // for now
        
        overlay.addFeatures([layer1]);
    }
    
	// ********* calculated center location based on mean values *********
	const x_sum = coords_x_list.reduce((a, b) => a + b, 0);
	const x_avg = (x_sum / coords_x_list.length) || 0;
	const y_sum = coords_y_list.reduce((a, b) => a + b, 0);
	const y_avg = (y_sum / coords_y_list.length) || 0;
	var centerLocation = new OpenLayers.Geometry.Point(y_avg, x_avg).transform('EPSG:4326', 'EPSG:3857');
    // var centerLocation = new OpenLayers.Geometry.Point(21.01, 52.23).transform('EPSG:4326', 'EPSG:3857');  // fixed value
	
	
	/* TODO: multiple markers in the same location
	https://www.anycodings.com/1questions/1538423/how-to-display-multiple-markers-with-individual-onclick-event-asociated-with-them-in-openlayers-6
	https://flaviocopes.com/how-to-inspect-javascript-object/
	https://stackoverflow.com/questions/7790811/how-do-i-put-variables-inside-javascript-strings
	
	-maybe it will be better to slightly move postion of markers
	-e.g. create circle from many markers
	*/
	
    // Finally we create the map
    map = new OpenLayers.Map({
        div: "map", projection: "EPSG:3857",
        layers: [new OpenLayers.Layer.OSM(), overlay],
        center: centerLocation.getBounds().getCenterLonLat(),
        zoom: 13,
        eventListeners: {
            featureover: function(e) {
                //pass
            },
            featureout: function(e) {
                //pass
            },
            featureclick: function(e) {
				// update info about advertisment
                url = e.feature.ad_url;
                cost = e.feature.cost;
				var adDiv = createAdvertismentInfo(url, cost);
				var allChildren = adColumn.getElementsByTagName('div').length;
				if (allChildren > 7) {
					adColumn.removeChild(adColumn.lastChild);
				}
				adColumn.innerHTML = adDiv.outerHTML + adColumn.innerHTML; // insert before
				
				// ********* multiple markers in the same location handling; in develop *********
				// let coordinate = e.feature.currentLocation;
				// console.dir(e);  // FOR DEBUG - inspect object
				// var log_str = `url: ${url}, cost: ${cost}, coordinate: ${coordinate}`; // DEBUG
                // console.log(log_str);
            }
        }
    });
}

function createAdvertismentInfo(href, cost) {
	// https://www.tutorialspoint.com/how-to-add-a-new-element-to-html-dom-in-javascript
	// https://stackoverflow.com/questions/27079598/error-failed-to-execute-appendchild-on-node-parameter-1-is-not-of-type-no
	var adDiv = document.createElement("div");
	var url = document.createElement("a");
	url.setAttribute('href', href);
	url.innerHTML = href;
	var costParagraph = document.createElement("p"); 
	var textNode = document.createTextNode(cost + " PLN"); 
	costParagraph.appendChild(textNode);
	var hr = document.createElement("hr");
	adDiv.appendChild(url);
	adDiv.appendChild(costParagraph);
	adDiv.appendChild(hr);
	return adDiv;
}

function clickOnFeatures(browserEvent) {
	// https://www.anycodings.com/1questions/1538423/how-to-display-multiple-markers-with-individual-onclick-event-asociated-with-them-in-openlayers-6
	let coordinate = browserEvent.coordinate;
	let pixel = map.getPixelFromCoordinate(coordinate);
	map.forEachFeatureAtPixel(pixel, function (feature) {
		console.log("feature", feature);
		console.log("name", feature.values_.name);
	});
}

function renderProductList(element, index, arr) {
	// https://stackoverflow.com/questions/11351135/create-ul-and-li-elements-in-javascript
	var li = document.createElement('li');
	li.setAttribute('class','item');
	ul.appendChild(li);
	li.innerHTML=li.innerHTML + element;
}

function csv2array(data, delimeter) {
  // http://www.speqmath.com/tutorials/csv2array/
  // Retrieve the delimeter
  if (delimeter == undefined) 
    delimeter = ',';
  if (delimeter && delimeter.length > 1)
    delimeter = ',';

  // initialize variables
  var newline = '\n';
  var eof = '';
  var i = 0;
  var c = data.charAt(i);
  var row = 0;
  var col = 0;
  var array = new Array();

  while (c != eof) {
    // skip whitespaces
    while (c == ' ' || c == '\t' || c == '\r') {
      c = data.charAt(++i); // read next char
    }
    
    // get value
    var value = "";
    if (c == '\"') {
      // value enclosed by double-quotes
      c = data.charAt(++i);
      
      do {
        if (c != '\"') {
          // read a regular character and go to the next character
          value += c;
          c = data.charAt(++i);
        }
        
        if (c == '\"') {
          // check for escaped double-quote
          var cnext = data.charAt(i+1);
          if (cnext == '\"') {
            // this is an escaped double-quote. 
            // Add a double-quote to the value, and move two characters ahead.
            value += '\"';
            i += 2;
            c = data.charAt(i);
          }
        }
      }
      while (c != eof && c != '\"');
      
      if (c == eof) {
        throw "Unexpected end of data, double-quote expected";
      }

      c = data.charAt(++i);
    }
    else {
      // value without quotes
      while (c != eof && c != delimeter && c!= newline && c != ' ' && c != '\t' && c != '\r') {
        value += c;
        c = data.charAt(++i);
      }
    }

    // add the value to the array
    if (array.length <= row) 
      array.push(new Array());
    array[row].push(value);
    
    // skip whitespaces
    while (c == ' ' || c == '\t' || c == '\r') {
      c = data.charAt(++i);
    }

    // go to the next row or column
    if (c == delimeter) {
      // to the next column
      col++;
    }
    else if (c == newline) {
      // to the next row
      col = 0;
      row++;
    }
    else if (c != eof) {
      // unexpected character
      throw "Delimiter expected after character " + i;
    }
    
    // go to the next character
    c = data.charAt(++i);
  }  
  
  return array;
}

function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

function pastePage(url, div_element){
    // paste page from specified url, to specified div
	// https://stackoverflow.com/questions/27358966/how-to-set-x-frame-options-on-iframe
	// https://en.wikipedia.org/wiki/Framekiller
}

/*
OpenLayers events example:
    http://dev.openlayers.org/examples/feature-events.html
    
Store data in marker:
    https://stackoverflow.com/questions/18155208/adding-data-to-an-open-layers-marker
    
Think of:
	http://bl.ocks.org/d3noob/7654694
	https://d19vzq90twjlae.cloudfront.net/leaflet-0.7/leaflet.js
	
*/
