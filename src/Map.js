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
        L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';

        let map = L.map('map').setView([38.833, -50.826], 3);

        L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYm9tYmJvbWIiLCJhIjoiY2owZ3dram8yMDJ2cTMycDU3M3JuOW5vZSJ9._eHrHFHdFpyrX4eJ82Whgg', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 6
        }).addTo(map);

        this.setState({map: map}, () => {
            this.initializeRegions();
            this.setupSocketListener();
        });
    }

    setupSocketListener() {
        let socket = client.connect('http://iris.bbhydra.com');

        socket.on('event', (message) => {
            if (message.type === undefined) return;
            if (message.type === 'Mob') this.updateUser(message.data);
            if (message.type === 'Infrastructure') this.updateInfrastructures(message.data);
        });
    }

    updateUser(userMsg)
    {
        const { users, regions, map } = this.state;

        let user = users[userMsg.name];
        let region = regions[userMsg.region];
        if (user === undefined)
        {
            user = new User(userMsg, this.props.changePanel);
        }
        else
        {
            if (user.isConnectedToRegion() && user.getConnectedToRegion().name != userMsg.region) {
                user.getConnectedLine().removeFrom(map);
            }

            user.marker.removeFrom(map);
            user.update(userMsg);
        }

        user.marker.addTo(map);

        if (region !== undefined)
        {
            user.connectToRegion(region).addTo(map);

            //setTimeout(() => this.fadeAway(user), 500);
            setTimeout(() => user.getConnectedLine().removeFrom(map), 1000);
        }

        users[userMsg.name] = user;
        this.setState({ users: users });
    }

    updateInfrastructures(infraMsg)
    {
        this.clearRegions();
        this.updateRegions(infraMsg);
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

    initializeRegions()
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

                    this.updateRegions(regionsResponse);
                }
            );
    }

    clearRegions()
    {
        let regions = this.state.regions;

        for (let key in regions) {
            if (regions.hasOwnProperty(key) && regions[key] instanceof Region) {
                regions[key].marker.removeFrom(this.state.map);
            }
        }
    }

    updateRegions(rawRegions)
    {
        let regions = {};

        rawRegions.forEach((regionRaw) => {
            let region = new Region(regionRaw, this.props.changePanel);
            regions[region.name] = region;

            region.marker.addTo(this.state.map);
        });

        this.setState({ regions: regions });
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
