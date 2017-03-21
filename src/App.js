import React, { Component } from 'react';
import './css/App.css';
import classNames from 'classnames';

import Map from './Map.js';
import Sidebar from './Sidebar.js';

class App extends Component {

    constructor(props)
    {
      super(props);

      this.state = {
          showSidebar: false,
          sidebarDetails: null
      };
    }

    toggle()
    {
        this.setState({ showSidebar: !this.state.showSidebar });
    }

    changePanel(details)
    {
        this.setState({
            showSidebar: true,
            sidebarDetails: details
        });
    }

    render() {
      const { showSidebar, sidebarDetails } = this.state;

      return (
        <div
            className={
                classNames({
                    "App": true,
                    "show-sidebar": showSidebar,
                    "no-selections": sidebarDetails == null
                })
            }
        >
            <Map
                changePanel={this.changePanel.bind(this)}
            />

            <div
                className="close-button"
                onClick={() => this.toggle()}
            >
                <i
                    className={
                        classNames({
                            "fa": true,
                            "fa-1x": true,
                            "fa-chevron-right": showSidebar,
                            "fa-chevron-left": !showSidebar
                        })
                    }
                    aria-hidden="true"
                ></i>
            </div>
            <Sidebar
                details={sidebarDetails}
            />
        </div>
      );
  }
}

export default App;
