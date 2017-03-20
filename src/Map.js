import React, { Component } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './css/Map.css';
import './vendors/font-awesome/css/font-awesome.css';
import './vendors/awesome-markers/leaflet.awesome-markers.css';
import './vendors/awesome-markers/leaflet.awesome-markers.js';

class Map extends Component {

    constructor(props)
    {
        super(props);
    }

    componentDidMount()
    {
        var bombBombLatLng = [38.833, -104.826];
        var yorkLatLng = [40.843, -97.578];
        var phoenixLatLng = [33.520418, -112.175900];
        var lasVegasLatLng = [36.150026, -115.153320];

        var disneyLandLatLng = [33.811, -117.919];
        var disneyWorldLatLng = [28.370896, -81.543354];

        L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';

        var serverIcon = L.AwesomeMarkers.icon({
            icon: 'server',
            markerColor: 'purple',
            iconColor: 'white'
        });

        var userIcon = L.AwesomeMarkers.icon({
            icon: 'user',
            markerColor: 'blue',
            iconColor: 'white'
        });

        var map = L.map('map').setView(bombBombLatLng, 4);

        L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYm9tYmJvbWIiLCJhIjoiY2owZ3dram8yMDJ2cTMycDU3M3JuOW5vZSJ9._eHrHFHdFpyrX4eJ82Whgg', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18
        }).addTo(map);

        function makeServer(name, latLng)
        {
            var serverMarker = L.marker(latLng, {icon: serverIcon}).addTo(map);
            serverMarker.bindPopup("<b>Hydra Region</b><br>I am the " + name + " server. Wee!");
        }

        function makeAUser(name, locationLatLng, serverLatLng)
        {
            var bombBombMarker = L.marker(locationLatLng, {icon: userIcon}).addTo(map);
            bombBombMarker.bindPopup("<b>Part of the Mob</b><br>My name is " + name + ". Nice to meet you!");

            var latlngs = [];
            latlngs.push(locationLatLng);
            latlngs.push(serverLatLng);

            var polyline = L.polyline(latlngs, {
                color: '#38A9DB',
                weight: 2,
                opacity: 0.7
            }).addTo(map);
            polyline.bindPopup("<b>Hello line!</b><br>I am a popup.");
        }

        makeServer('Disney Land', disneyLandLatLng);
        makeServer('Disney World', disneyWorldLatLng);

        makeAUser('Bob', bombBombLatLng, disneyLandLatLng);
        makeAUser('Sally', phoenixLatLng, disneyLandLatLng);
        makeAUser('Elvis', lasVegasLatLng, disneyLandLatLng);

        makeAUser('Chuck', yorkLatLng, disneyWorldLatLng);
    }

    render() {
        return (
            <div className="Map">
                <div id="map"></div>
            </div>
        );
    }
}

export default Map;
