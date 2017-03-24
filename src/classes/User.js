import L from 'leaflet';
import Region from './Region.js';

export class User
{
    constructor(user, clickCallback)
    {
        this.update(user);

        this.marker =
            this.isClient() ?
                L.marker(this.getLatLng(), {icon: L.AwesomeMarkers.icon({
                    icon: 'user-circle-o',
                    markerColor: 'purple',
                    iconColor: 'white'
                })})
                : L.circle(this.getLatLng(), {
                    color: this.getColor(),
                    fillColor: 'white',
                    fillOpacity: 0.7,
                    opacity: 0.7,
                    radius: 2000
                });

        this.marker.on('click', () => {
            clickCallback(this);
        });
    }

    update(user)
    {
        for (let key in user) {
            if (user.hasOwnProperty(key)) {
                this[key] = user[key];
            }
        }
    }

    isClient()
    {
        return this.name == 'You'
    }

    getColor()
    {
        let color = 'green';

        if (this.lastPing > 200) color = 'red';
        else if (this.lastPing > 100) color = 'orange';

        return color;
    }

    getLatLng()
    {
        return [this.lat, this.long];
    }

    isConnectedToRegion()
    {
        return this.connectedRegion instanceof Region;
    }

    connectToRegion(region)
    {
        this.connectedRegion = region;

        this.connectedPolyLine = L.polyline(
            [this.getLatLng(), region.getLatLng()],
            {
                color: this.getColor(),
                weight: 2,
                opacity: this.isClient() ? 0.7 : 0.3
            }
        );

        return this.connectedPolyLine;
    }

    getConnectedLine()
    {
        return this.connectedPolyLine;
    }

    getConnectedToRegion()
    {
        return this.connectedRegion;
    }
}

export default User;