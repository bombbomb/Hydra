import React, { Component } from 'react';

class RegionPanel extends Component {

    getContent()
    {
        const details = this.props.details;

        let environments = [];
        details.environments.forEach(function(environment) {
            environments.push((
                <div className="environment-block" key={details.name + environment.revision}>
                    <div className="environment-revision">Revision {environment.revision}</div>
                    <div>Status: {environment.status}</div>
                    <div>Instances: {environment.instanceCount}</div>
                    <div>Traffic Weight: {environment.trafficWeight}</div>
                    <div>Error Rate: {environment.errRate}</div>
                </div>
            ));
        });

        return (
            <div>
                {environments}
            </div>
        )
    }

    render() {
        return (
            <div className="Sidebar">
                <div>
                    <h2>{this.props.details.name}</h2>
                </div>

                {this.getContent()}
            </div>
        );
    }
}

export default RegionPanel;
