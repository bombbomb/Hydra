import React, { Component } from 'react';

class UserPanel extends Component {

    render() {
        const { details } = this.props;

        return (
            <div>
                <div>
                    <h2>{details.name}</h2>
                </div>
            </div>
        );
    }
}

export default UserPanel;
