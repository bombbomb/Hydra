import React, { Component } from 'react';

class RegionPanel extends Component {

    getContent()
    {
        const details = this.props.details;

        let environments = [];
        details.environments.forEach(function(environment) {
            environments.push((
                <div className="environment-block" key={details.name + environment.name}>
                    <div className="environment-revision">{environment.name} environment</div>
                    <div>Instances ({environment.instances.length})</div>
                    {
                        environment.instances.map(function(instance) {
                            return (
                                <div className="instance-block">
                                    <div className="instance-header">{instance.name} instance</div>
                                    <div>Status: {instance.status}</div>
                                    <div>Created: {instance.created}</div>
                                </div>
                            );
                        })
                    }
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
