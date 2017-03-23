import React, { Component } from 'react';

class UserPanel extends Component {

    render() {
        const { details } = this.props;

        return (
            <div>
                <div>
                    <h2>{details.name}</h2>
                </div>

                <div>
                    <div>Last Ping: {details.lastPing}</div>
                    <div>Lag: {details.personalLag}</div>
                    <div>Click Delay: {details.clickDelay}</div>
                    <div>Connected to Region: {details.region}</div>
                </div>
            </div>
        );
    }
}

export default UserPanel;
