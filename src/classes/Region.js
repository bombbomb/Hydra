import L from 'leaflet';

export class Region
{
    constructor(region)
    {
        for (let key in region) {
            if (region.hasOwnProperty(key)) {
                this[key] = region[key];
            }
        }

        let serverIcon = L.AwesomeMarkers.icon({
            icon: 'server',
            markerColor: 'purple',
            iconColor: 'white'
        });

        this.marker = L.marker(region.location, {icon: serverIcon});
    }

    updateEnvironments(environments)
    {
        environments.forEach((environment) => {

            for (let i = 0; i < this.environments.length; i++)
            {
                if (environment.revision == this.environments[i].revision)
                {
                    Object.assign(this.environments[i], environment);
                    break;
                }
            }

        });
    }

}

export default Region;