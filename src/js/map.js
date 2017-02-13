/*

This file contains functionality related to the
mapping.

*/

import _ from 'underscore';
import MapGL from 'react-map-gl';
import window from 'global/window';
import pkg from '../../package.json';
import { callAction } from './store';
import React, { Component } from 'react';
import ViewportMercator from 'viewport-mercator-project';
import transform from 'svg-transform';
import { OffensiveLayer, DefensiveLayer } from './calculations';
import { alphaify } from './utils';


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
    let layers = {
        'offensive': [],
        'defensive': []
    }

    for (let layer of document.elementsFromPoint(x, y)) {
        const index = parseInt(layer.getAttribute('data-index'), 10),
              type = layer.getAttribute('data-layer-type')

        if ((index || index === 0) && type) {
            layers[type].push(index)
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

        this.getCoordinates = this.getCoordinates.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = _.debounce(this.onDragEnd.bind(this), 1000);
    }

    getCoordinates(e) {
        return [
            typeof e.clientX === 'undefined' ? e.changedTouches[0].clientX : e.clientX,
            typeof e.clientY === 'undefined' ? e.changedTouches[0].clientY : e.clientY
        ];
    }

    onDragStart(e) {
        if (this.props.onDragStart) {
            this.props.onDragStart(e, {
                latitude: this.state.latitude,
                longitude: this.state.longitude
            });
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
        if (this.props.onDragEnd && (this.state.latitude !== this.props.latitude || this.state.longitude !== this.props.longitude)) {
            this.props.onDragEnd(e, {
                latitude: this.state.latitude,
                longitude: this.state.longitude
            });
        }

        this.setState({dragging: false});
    }

    render() {
        const mercator = ViewportMercator(this.props),
              {width, height, isDragging} = this.props,
              {longitude, latitude} = this.state,
              {project, unproject} = mercator,
              style = {
                cursor: isDragging ? 'grabbing' : 'grab',
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


const MapLayer = ({ index, type, mapProps, position, range, color, probability, onDragEnd }) =>
    <DraggableSVGOverlay {...mapProps} onDragEnd={onDragEnd} redraw={opt => {
        const radius = radiusAtZoom(range ? range : 1, mapProps.zoom),
              fillColor = colorAtProbability(color, probability || 0),
              strokeWidth = 5,
              strokeSpacing = 4;

        return <g onClick={(e)=> layersAtLocation(e.clientX, e.clientY)} style={{
            pointerEvents: 'all',
            cursor: 'pointer'
        }}>
            <circle
                data-index={index}
                data-layer-type={type}
                style={ {fill: fillColor, stroke: fillColor} }
                transform={ transform([{translate: opt.project(position || [opt.longitude, opt.latitude])}]) }
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
                transform={ transform([{translate: opt.project(position || [opt.longitude, opt.latitude])}]) }
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
            width: Math.max(document.documentElement.clientWidth * 0.75, window.innerWidth * 0.75 || 0),
            height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
            viewport: {
                zoom: 10,
                latitude: props.target.latitude,
                longitude: props.target.longitude,
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
            latitude: this.props.target.latitude,
            longitude: this.props.target.longitude,
            mapboxApiAccessToken: pkg.maptoken,
            onDragStart: () => this.setState({childrendragging:true}),
            onDragEnd: () => this.setState({childrendragging:false}),
            onClick: () => layersAtLocation()
        };

        return <div className="map">
            <MapGL { ...mapProps } onChangeViewport={ this._onChangeViewport }>
                <LayerColorLegend colors={colors} />
                { this.props.layers.offensive.filter(l => l.type).filter(l => l.range && l.range > 0).map((layer, index) =>
                    <MapLayer
                        key={index}
                        index={index}
                        type='offensive'
                        mapProps={mapProps}
                        color={colors.offensive}
                        range={layer.range}
                        probability={OffensiveLayer(layer, this.props.target.hardness) || undefined}
                        position={layer.latitude && layer.longitude ? [layer.longitude, layer.latitude] : undefined}
                        onDragEnd={(e, { latitude, longitude }) => callAction('UPDATE_LAYER', {
                            layer: { latitude, longitude },
                            type: 'offensive',
                            index
                        })}
                    />
                )}
                { this.props.layers.defensive.filter(l => l.range && l.range > 0).map((layer, index) =>
                    <MapLayer
                        key={index}
                        index={index}
                        type='defensive'
                        mapProps={mapProps}
                        range={layer.range}
                        color={colors.defensive}
                        probability={DefensiveLayer(layer) || undefined}
                        position={layer.latitude && layer.longitude ? [layer.longitude, layer.latitude] : undefined}
                        onDragEnd={(e, { latitude, longitude }) => callAction('UPDATE_LAYER', {
                            layer: { latitude, longitude },
                            type: 'defensive',
                            index
                        })}
                    />
                )}
            </MapGL>
        </div>
    }
}

// This allows other parts of the application to access these functions
export { MapControl, MapLayer, dashLayer, colors }
