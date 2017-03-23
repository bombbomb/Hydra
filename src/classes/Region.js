import L from 'leaflet';

export class Region
{
    constructor(region, clickCallback)
    {
        for (let key in region) {
            if (region.hasOwnProperty(key)) {
                this[key] = region[key];
            }
        }

        let serverIcon = L.AwesomeMarkers.icon({
            icon: 'server',
            markerColor: 'blue',
            iconColor: 'white'
        });

        this.marker = L.marker(this.getLatLng(), {icon: serverIcon});

        this.marker.on('click', () => {
            clickCallback(this);
        });
    }

    getLatLng()
    {
        return [this.lat, this.long];
    }

    update(regionStats)
    {
        for (let key in regionStats) {
            if (regionStats.hasOwnProperty(key) && key !== 'environments') {
                this[key] = regionStats[key];
            }
        }

        regionStats.environments.forEach((environment) => {

            for (let i = 0; i < this.environments.length; i++)
            {
                if (environment.revision === this.environments[i].revision)
                {
                    for (let key in environment) {
                        if (environment.hasOwnProperty(key)) {
                            this.environments[i][key] = environment[key];
                        }
                    }
                    break;
                }
            }

        });
    }

}

export default Region;