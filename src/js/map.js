import React, { Component } from 'react';
import MapGL from 'react-map-gl';

class MapControl extends Component {
    constructor(props) {
        super(props);
        this.state = {
            viewport: {
                latitude: 37.7577,
                longitude: -122.4376,
                zoom: 8,
                startDragLngLat: null,
                isDragging: false
            }
        }

        this._onChangeViewport = this._onChangeViewport.bind(this);
    }

    _onChangeViewport(viewport) {
        if (this.props.onChangeViewport) {
          return this.props.onChangeViewport(viewport);
        }
        this.setState({viewport});
    }

    render() {
        const mapProps = {
            ...this.state.viewport,
            ...this.props,
            width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
            height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
            onChangeViewport: this._onChangeViewport,
            mapboxApiAccessToken: "REPLACEME"
        };

        return <MapGL { ...mapProps } />
    }
}

export { MapControl }
