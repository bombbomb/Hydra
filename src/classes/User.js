import L from 'leaflet';

export class User
{
    constructor(user, clickCallback)
    {
        this.update(user);

        let userIcon = L.AwesomeMarkers.icon({
            icon: 'user',
            markerColor: 'blue',
            iconColor: 'white'
        });

        this.marker = L.marker(this.getLatLng(), {icon: userIcon});

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

    connectToRegion(region)
    {
        this.connectedRegion = region;
        this.connectedPolyLine = L.polyline(
            [this.getLatLng(), region.location],
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