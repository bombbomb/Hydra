import L from 'leaflet';
import Region from './Region.js';

export class User
{
    constructor(user, clickCallback)
    {
        this.update(user);

        this.marker = L.circle(this.getLatLng(), {
            color: '#38A9DB',
            fillColor: 'white',
            fillOpacity: 1,
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
                color: '#38A9DB',
                weight: 2,
                opacity: 0.7
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