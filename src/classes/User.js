import L from 'leaflet';

export class User
{
    constructor(user)
    {
        for (let key in user) {
            if (user.hasOwnProperty(key)) {
                this[key] = user[key];
            }
        }

        let userIcon = L.AwesomeMarkers.icon({
            icon: 'user',
            markerColor: 'blue',
            iconColor: 'white'
        });

        this.marker = L.marker(user.location, {icon: userIcon});

        this.conectedPolyLine = L.polyline(
            [this.location, this.region.location],
            {
                color: '#38A9DB',
                weight: 2,
                opacity: 0.7
            }
        );
    }
}

export default User;