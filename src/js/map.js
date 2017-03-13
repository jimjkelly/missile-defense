/*

This file contains functionality related to the
mapping.

*/

import MapGL from 'react-map-gl';
import window from 'global/window';
import pkg from '../../package.json';
import { callAction, reducerMap } from './store';
import React, { Component } from 'react';
import autobind from 'autobind-decorator';
import ViewportMercator from 'viewport-mercator-project';
import transform from 'svg-transform';
import { OffensiveLayer, DefensiveLayer } from './calculations';
import { alphaify } from './utils';


Object.assign(reducerMap, {
    UPDATE_MAP: (state, action) => {
        return Object.assign({}, state, {
            map: Object.assign({}, state.map, action.data)
        });
    }
});


// Some colors used that we can refer to
const colors = {
    offensive: '#ff5a5f',
    defensive: '#1fbad6'
}


const colorAtProbability = (color, p) => {
    return alphaify(color, 0.6, (-(4*p)+2));
}


// Calculate a radius given meters and zoom level
const radiusAtZoom = (meters, zoom) => {
    // 17 here is a constant that is supposed to
    // correspond to the initial zoom level, but it
    // doesn't appear to, since that is set to 10.
    // https://github.com/uber/react-map-gl/pull/10
    return (meters * Math.pow(2, zoom - 17));
}


const dashLayer = index => {
    return [Math.pow(2, index+1), Math.pow(2, index)+1];
}


const layersAtLocation = (x, y) => {
    // No Safari support for elementsFromPoint?  :/
    // polyfill: https://gist.github.com/oslego/7265412
    let layers = []

    for (let layer of document.elementsFromPoint(x, y)) {
        const index = parseInt(layer.getAttribute('data-index'), 10);

        if (index || index === 0) {
            layers.push(index)
        }
    }

    callAction('UPDATE_ACTIVE_LAYERS', layers);
}


// This provides the draggable circles
class DraggableSVGOverlay extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dragging: false,
            longitude: this.props.longitude,
            latitude: this.props.latitude
        };
    }

    @autobind
    getCoordinates(e) {
        return [
            typeof e.clientX === 'undefined' ? e.changedTouches[0].clientX : e.clientX,
            typeof e.clientY === 'undefined' ? e.changedTouches[0].clientY : e.clientY
        ];
    }

    @autobind
    onDragStart(event) {
        event.stopPropagation();
        document.addEventListener('mousemove', this.onDrag, false);
        document.addEventListener('mouseup', this.onDragEnd, false);
        if (this.props.onDragStart) {
            this.props.onDragStart(event, {
                latitude: this.state.latitude,
                longitude: this.state.longitude
            });
        }

        this.setState({dragging: true});
    }

    @autobind
    onDrag(event) {
        event.stopPropagation();

        if (this.state.dragging) {
            const [longitude, latitude] = this.props.unproject(this.getCoordinates(event));
            this.setState({
                longitude,
                latitude
            });
        }
    }

    @autobind
    onDragEnd(event) {
        event.stopPropagation();

        if (this.state.dragging) {
            document.removeEventListener('mousemove', this.onDrag, false);
            document.removeEventListener('mouseup', this.onDragEnd, false);

            this.setState({dragging: false});
            if (this.props.onDragEnd && (this.state.latitude !== this.props.latitude || this.state.longitude !== this.props.longitude)) {
                this.props.onDragEnd(event, {
                    latitude: this.state.latitude,
                    longitude: this.state.longitude
                });
            }
        }
    }

    render() {
        const {longitude, latitude} = this.state,
              {width, height, zoom, isDragging} = this.props,
              style = {
                ...this.props.style,
                cursor: isDragging ? 'grabbing' : 'grab',
                pointerEvents: 'none',
                position: 'absolute',
                left: 0,
                top: 0
              };

        return <svg
            ref="overlay"
            style={style}
            width={this.props.width}
            height={this.props.height}
        >
            <g onMouseDown={this.onDragStart}>
                { this.props.redraw({width, height, zoom, longitude, latitude, isDragging}) }
            </g>
        </svg>
    }
}


const MapLayer = ({ index, type, mapProps, latitude, longitude, range, project, unproject, color, probability }) =>
    <DraggableSVGOverlay {...mapProps} latitude={latitude} longitude={longitude} unproject={unproject} redraw={opt => {
        const radius = radiusAtZoom(range ? range : 1, mapProps.zoom),
              fillColor = colorAtProbability(color, probability || 0),
              strokeWidth = 5,
              strokeSpacing = 4;

        return <g onClick={(e) => layersAtLocation(e.clientX, e.clientY)} style={{
            pointerEvents: 'all',
            cursor: 'pointer'
        }}>
            <circle
                data-index={index}
                data-layer-type={type}
                style={ {fill: fillColor, stroke: fillColor} }
                transform={transform([{translate: project([opt.longitude, opt.latitude])}])}
                r={radius}
            />
            <circle
                style={ {
                    strokeWidth,
                    strokeDasharray: dashLayer(index),
                    pointerEvents: 'none',
                    stroke: fillColor,
                    fill: 'none'
                }}
                transform={ transform([{translate: project([opt.longitude, opt.latitude])}]) }
                r={(
                    ((2*radius) + (2*strokeWidth) + strokeSpacing)/2
                )}
            />
        </g>
    }} />


const LayerColorLegend = ({ colors }) =>
    <svg style={{ pointerEvents: 'none', cursor: 'none' }} width="160" height="60" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <defs>
            {Object.keys(colors).map(type =>
                <linearGradient key={type} id={type}>
                    <stop className="stop1" offset="0%" stopColor={colorAtProbability(colors[type], 0)} />
                    <stop className="stop2" offset="100%" stopColor={colorAtProbability(colors[type], 1)} />
                </linearGradient>
            )}
        </defs>
        <text x="5" y="20">0%</text>
        <text x="105" y ="20">100%</text>
        {Object.keys(colors).map((type, i) =>
            <rect key={type} x="10" y={((i+1)*15) + 10} width="120" height="10" fill={`url(#${type})`} />
        )}
    </svg>


// This is the map itself
class MapControl extends Component {
    constructor(props) {
        super(props);

        this.state = {
            childrendragging: false,
            viewport: {
                zoom: props.map.zoom,
                latitude: props.target.latitude,
                longitude: props.target.longitude,
                width: Math.max(document.documentElement.clientWidth * 0.75, window.innerWidth * 0.75 || 0),
                height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
                startDragLngLat: null
            }
        }
    }

    @autobind
    _onChangeViewport(viewport) {
        if (this.state.childrendragging) {
            return;
        }

        if (this.state.viewport.latitude != viewport.latitude || this.state.viewport.longitude != viewport.longitude) {
            callAction('UPDATE_TARGET', { latitude: viewport.latitude, longitude: viewport.longitude });
        }

        if (this.state.viewport.zoom != viewport.zoom) {
            callAction('UPDATE_MAP', { zoom: viewport.zoom });
        }

        if (this.props.onChangeViewport) {
          this.props.onChangeViewport(viewport);
        }

        this.setState({
            viewport: {
                ...this.state.viewport,
                ...viewport
            }
        });
    }

    @autobind
    _resize() {
        this.setState({
            viewport: {
                ...this.state.viewport,
                width: Math.max(document.documentElement.clientWidth * 0.75, window.innerWidth * 0.75 || 0),
                height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
            }
        })
    }

    componentDidMount() {
        window.addEventListener('resize', this._resize)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this._resize)
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.target.latitude !== nextProps.target.latitude || this.props.target.longitude !== nextProps.target.longitude) {
            this.setState(state => ({
                ...state,
                viewport: {
                    ...state.viewport,
                    latitude: nextProps.target.latitude,
                    longitude: nextProps.target.longitude
                }
            }));
        }
    }

    render() {
        const childrenDragging = (value) => this.setState({childrendragging:value});
        const {project, unproject} = ViewportMercator(this.state.viewport);
        const mapProps = {
            ...this.props,
            ...this.state.viewport,
            mapboxApiAccessToken: pkg.maptoken,
            isDragging: this.state.childrendragging,
            onClick: () => layersAtLocation()
        };

        return <div className="map">
            <MapGL { ...mapProps } onChangeViewport={ this._onChangeViewport }>
                <LayerColorLegend colors={colors} />
                { this.props.layers.filter(l => l.range && l.range > 0).map((layer, index) => <MapLayer
                        key={index}
                        index={index}
                        type={layer.type}
                        color={colors[layer.type]}
                        range={layer.range}
                        project={project}
                        unproject={unproject}
                        latitude={layer.latitude || this.props.target.latitude}
                        longitude={layer.longitude || this.props.target.longitude}
                        probability={layer.type === 'offensive'
                            ? OffensiveLayer(layer, this.props.target.hardness) || undefined
                            : layer.type === 'defensive'
                            ? DefensiveLayer(layer) || undefined
                            : undefined
                        }
                        mapProps={{
                            ...mapProps,
                            onDragStart: () => childrenDragging(true),
                            onDragEnd: (e, { latitude, longitude }) => {
                                childrenDragging(false);
                                callAction('UPDATE_LAYER', {
                                    layer: { latitude, longitude },
                                    index
                                })
                            }
                        }}
                    />
                )}
            </MapGL>
        </div>
    }
}

// This allows other parts of the application to access these functions
export { MapControl, MapLayer, dashLayer, colors }
