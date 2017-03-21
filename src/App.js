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
        showSidebar: false
      };
    }

    toggle()
    {
        this.setState({ showSidebar: !this.state.showSidebar });
    }

    render() {
      const { showSidebar } = this.state;

      return (
        <div
            className={
                classNames({
                    "App": true,
                    "show-sidebar": showSidebar
                })
            }
        >
            <Map />

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
            <Sidebar />
        </div>
      );
  }
}

export default App;
