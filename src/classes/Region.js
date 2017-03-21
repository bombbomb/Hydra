import L from 'leaflet';

export class Region
{
    constructor(region)
    {
        this.updateKeys(region);

        let serverIcon = L.AwesomeMarkers.icon({
            icon: 'server',
            markerColor: 'purple',
            iconColor: 'white'
        });

        this.marker = L.marker(region.location, {icon: serverIcon});
    }

    update(regionStats)
    {
        this.updateKeys(regionStats);

        regionStats.environments.forEach((environment) => {

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

    updateKeys(keys)
    {
        for (let key in keys) {
            if (keys.hasOwnProperty(key)) {
                this[key] = keys[key];
            }
        }
    }

}

export default Region;