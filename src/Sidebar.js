import React, { Component } from 'react';
import './css/Sidebar.css';

class Sidebar extends Component {

    getBanner()
    {
        return this.props.details.name;
    }

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

        if (this.props.details == null) return null;

        return (
            <div className="Sidebar">
                <div>
                    <h2>{this.getBanner()}</h2>
                </div>

                {this.getContent()}
            </div>
        );
    }
}

export default Sidebar;
