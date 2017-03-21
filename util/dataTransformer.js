class DataTransformer
{
    constructor ()
    {}

    fromInfrastructure (data)
    {
        const regions = [];
        const returnObj = {};
        data.forEach(function(el, ind) {
            regions.push({
                id : el.id,
                name : el.region,
                location : el.location,
                environments : [{
                    status : el.status,
                    instanceCount : el.instanceCount,
                    trafficWeight : el.trafficWeight
                }]
            });
        });
        returnObj.regions = regions;
        return returnObj
    }

    fromLoad (data)
    {
        const regions = [];
        const returnObj = {};
        data.forEach(function(el, ind) {
            regions.push({
                id : el.id,
                name : el.region,
                environments : [{
                    errrate : el.errrate,
                    replicationLag : el.replicationLag
                }]
            });
        });
        returnObj.regions = regions;
        return regions
    }
}

module.exports = DataTransformer;