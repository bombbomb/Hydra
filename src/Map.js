import React, { Component } from 'react';
import L from 'leaflet';
import request from 'superagent';
import client from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import './vendors/font-awesome/css/font-awesome.css';
import './vendors/awesome-markers/leaflet.awesome-markers.css';
import './vendors/awesome-markers/leaflet.awesome-markers.js';

import './css/Map.css';
import Region from './classes/Region.js';
import User from './classes/User.js';

class Map extends Component {

    constructor(props)
    {
        super(props);

        this.state = {
            regions: {},
            users: {},
            map: null
        }
    }

    componentDidMount() {
        const bombBombLatLng = [38.833, -104.826];

        L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';

        let map = L.map('map').setView(bombBombLatLng, 4);

        L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYm9tYmJvbWIiLCJhIjoiY2owZ3dram8yMDJ2cTMycDU3M3JuOW5vZSJ9._eHrHFHdFpyrX4eJ82Whgg', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18
        }).addTo(map);

        this.setState({map: map}, () => {
            this.updateRegions(this.updateRegionLoad);
            this.setupSocketListener();
        });
    }

    setupSocketListener() {
        let socket = client.connect('http://iris.bbhydra.com');

        socket.on('event', (message) => {
            if (message.type === undefined || message.type !== 'Mob') return;

            let userMsg = message.data;

            const { users, regions, map } = this.state;

            let user = users[userMsg.name];
            let region = regions[userMsg.region];
            if (user === undefined)
            {
                user = new User(userMsg, this.props.changePanel);
                user.marker.addTo(map);
            }
            else
            {
                if (user.isConnectedToRegion() && user.getConnectedToRegion().name != userMsg.region) {
                    user.getConnectedLine().removeFrom(map);
                }

                user.update(userMsg);
            }

            if (region !== undefined)
            {
                user.connectToRegion(region).addTo(map);

                setTimeout(() => this.fadeAway(user), 500);
            }

            users[userMsg.name] = user;
            this.setState({ users: users });
        });
    }

    fadeAway(user)
    {
        let opacity = user.getConnectedLine().options.opacity;

        opacity = opacity - 0.05;

        if (opacity < 0) opacity = 0;

        user.getConnectedLine().setStyle({ opacity: opacity });

        opacity > 0 ?
            setTimeout(() => this.fadeAway(user), 200)
            : user.getConnectedLine().removeFrom(this.state.map);
    }

    updateRegions(callback)
    {
        request
            .get('/infrastructure')
            .end(
                (error, response) =>
                {
                    if (error)
                    {
                        console.log('Error', error);
                        return;
                    }

                    let regionsResponse = response.body;

                    if (!(regionsResponse instanceof Array))
                    {
                        console.log('Bad infrastructure response', regionsResponse);
                        return;
                    }

                    let regions = {};
                    regionsResponse.forEach((regionRaw) => {
                        let region = new Region(regionRaw, this.props.changePanel);
                        regions[region.name] = region;

                        region.marker.addTo(this.state.map);
                    });

                    this.setState({ regions: regions });
                    //this.setState({ regions: regions }, callback);
                }
            );
    }

    updateRegionLoad()
    {
        request
            .get('/load')
            .end(
                (error, response) =>
                {
                    if (error)
                    {
                        console.log('Error', error);
                        return;
                    }

                    let regionsResponse = response.body;

                    if (!(regionsResponse instanceof Array))
                    {
                        console.log('Bad load response', regionsResponse);
                        return;
                    }

                    let regions = this.state.regions;
                    regionsResponse.forEach((region) => {
                        regions[region.name].update(region);
                    });

                    this.setState({ regions: regions });
                }
            );
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
