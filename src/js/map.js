import MapGL from 'react-map-gl';
import window from 'global/window';
import pkg from '../../package.json';
import { callAction } from './store';
import React, { Component } from 'react';
import ViewportMercator from 'viewport-mercator-project';
import transform from 'svg-transform';
import { alphaify } from './utils';


const colors = {
    red: '#ff5a5f',
    blue: '#1fbad6',
    green: '#00a699'
}


class DraggableSVGOverlay extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dragging: false,
            longitude: this.props.longitude,
            latitude: this.props.latitude
        };

        this.getCoordinates = this.getCoordinates.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    getCoordinates(e) {
        return [
            typeof e.clientX === 'undefined' ? e.changedTouches[0].clientX : e.clientX,
            typeof e.clientY === 'undefined' ? e.changedTouches[0].clientY : e.clientY
        ];
    }

    onDragStart(e) {
        if (this.props.onDragStart) {
            this.props.onDragStart(e);
        }

        this.setState({
            dragging: true
        });
    }

    onDragMove(e) {
        if (!this.state.dragging) {
            return;
        } else {
            const {unproject} = ViewportMercator(this.props),
                  [longitude, latitude] = unproject(this.getCoordinates(e));

            this.setState({
                longitude,
                latitude
            });
        }
    }

    onDragEnd(e) {
        if (this.props.onDragEnd) {
            this.props.onDragEnd(e);
        }

        this.setState({dragging: false});
    }

    render() {
        const mercator = ViewportMercator(this.props),
              {width, height, isDragging} = this.props,
              {longitude, latitude} = this.state,
              {project, unproject} = mercator,
              style = {
                pointerEvents: 'none',
                position: 'absolute',
                left: 0,
                top: 0,
                ...this.props.style
              };

        return <svg
            ref="overlay"
            style={style}
            width={this.props.width}
            height={this.props.height}
            onMouseDown={this.onDragStart}
            onTouchStart={this.onDragStart}
            onMouseMove={this.onDragMove}
            onTouchMove={this.onDragMove}
            onMouseUp={this.onDragEnd}
            onTouchEnd={this.onDragEnd}
        >
            { this.props.redraw({width, height, longitude, latitude, project, unproject, isDragging}) }
        </svg>
    }
}


const Target = ({ mapProps, radius, color }) => {
    const mercator = ViewportMercator(mapProps),
          {project} = mercator,
          style = {
            pointerEvents: 'none',
            position: 'absolute',
            left: 0,
            top: 0,
          };

    return <svg style={style} width={mapProps.width} height={mapProps.height}>
        <g style={{
            pointerEvents: 'all',
            cursor: 'pointer'
        }}>
            <circle
                style={{fill: alphaify(color, 0.9), stroke: alphaify(color, 0.9)}}
                transform={ transform([{translate: project([mapProps.longitude, mapProps.latitude])}]) }
                r={(.2 * Math.pow(2, mapProps.zoom) / Math.pow(2, 6))}
            />
            <circle
                style={{fill: alphaify(color, 0.6), stroke: alphaify(color, 0.6)}}
                transform={ transform([{translate: project([mapProps.longitude, mapProps.latitude])}]) }
                r={(radius * Math.pow(2, mapProps.zoom) / Math.pow(2, 6))}
            />
        </g>
    </svg>
}


const MapLayer = ({ mapProps, range, color, brighter }) =>
    <DraggableSVGOverlay {...mapProps} redraw={opt => {
        return <g style={{
            pointerEvents: 'all',
            cursor: 'pointer'
        }}>
            <circle
                style={ {fill: alphaify(color, 0.6, brighter), stroke: alphaify(color, 0.6, brighter)} }
                transform={ transform([{translate: opt.project([opt.longitude, opt.latitude])}]) }
                r={((range ? range : 1) * Math.pow(2, mapProps.zoom) / Math.pow(2, 6))}
            />
        </g>
    }} />


class MapControl extends Component {
    constructor(props) {
        super(props);

        this.state = {
            childrendragging: false,
            width: Math.max(document.documentElement.clientWidth * 0.75, window.innerWidth * 0.75 || 0),
            height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
            viewport: {
                zoom: 10,
                latitude: props.target.get('latitude'),
                longitude: props.target.get('longitude'),
                startDragLngLat: null,
                isDragging: false
            }
        }

        this._resize = this._resize.bind(this);
        this._onChangeViewport = this._onChangeViewport.bind(this);
    }

    _onChangeViewport(viewport) {
        if (this.state.childrendragging) {
            return;
        }

        if (this.state.viewport.latitude != viewport.latitude || this.state.viewport.longitude != viewport.longitude) {
            callAction('UPDATE_TARGET', { latitude: viewport.latitude, longitude: viewport.longitude });
        }

        if (this.props.onChangeViewport) {
          return this.props.onChangeViewport(viewport);
        }

        this.setState({viewport});
    }

    _resize() {
        this.setState({
            width: Math.max(document.documentElement.clientWidth * 0.75, window.innerWidth * 0.75 || 0),
            height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0), 
        })
    }

    componentDidMount() {
        window.addEventListener('resize', this._resize)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this._resize)
    }

    render() {
        const mapProps = {
            ...this.props,
            ...this.state.viewport,
            width: this.state.width,
            height: this.state.height,
            latitude: this.props.target.get('latitude'),
            longitude: this.props.target.get('longitude'),
            mapboxApiAccessToken: pkg.maptoken,
            onDragStart: () => this.setState({childrendragging:true}),
            onDragEnd: () => this.setState({childrendragging:false})
        };

        return <div className="map">
            <MapGL { ...mapProps } onChangeViewport={ this._onChangeViewport }>
                <Target
                    mapProps={mapProps}
                    radius={this.props.target.get('radius')}
                    color={colors.green}
                />
                { this.props.layers.toJS().offensive.filter(l => l.type).map((layer, i) =>
                    <MapLayer
                        key={i}
                        mapProps={mapProps}
                        color={colors.red}
                        range={layer.cep}
                    />
                )}
                { this.props.layers.toJS().defensive.map((layer, i) =>
                    <MapLayer
                        key={i}
                        mapProps={mapProps}
                        range={layer.range}
                        color={colors.blue}
                    />
                )}
            </MapGL>
        </div>
    }
}

export { MapControl, MapLayer }
