import React, { Component } from 'react';
import './css/Sidebar.css';

import Region from './classes/Region.js';
import RegionPanel from './RegionPanel.js';
import UserPanel from './UserPanel.js';

class Sidebar extends Component {

    render() {
        const { details } = this.props;

        if (details == null) return null;

        return (
            <div className="Sidebar">
                {
                    details instanceof Region ?
                        <RegionPanel details={details} />
                        : <UserPanel details={details} />
                }
            </div>
        );
    }
}

export default Sidebar;
