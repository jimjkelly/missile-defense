import React from 'react';
import { MapControl } from './map';
import { layerDataTemplates, OffensiveLayer, DefensiveLayer } from './layers';
import { callAction } from './store';


const LayerButton = ({ type, action, children }) =>
	<div className="layer-button" onClick={e =>
		callAction(`${action}_LAYER`, 
		{
			type
		}
	)}>
		{children}
	</div>


const LayerSlider = ({ type, numLayers }) =>
	<div className="layer-slider">
		{numLayers} {numLayers === 1 ? " Layer" : " Layers" }
		<LayerButton type={type} action="ADD">
			<i className="fa fa-plus"></i>
		</LayerButton>
	</div>

const LayerControl = ({ type, layers, Layer }) =>
	<div className={`layer-control ${type}`}>
		<LayerSlider type={type} numLayers={layers.length} />
		{layers.map((layer, index) =>
			<Layer key={index} index={index} {...layer} />
		)}
	</div>

const Controls = ({ controls }) =>
	<div className="controls">
		<LayerControl
			type="offensive"
			Layer={OffensiveLayer}
			layers={controls.offensive}
		/>
		<LayerControl
			type="defensive"
			Layer={DefensiveLayer}
			layers={controls.defensive}
		/>
	</div>

const PageControl = ({ uistate }) =>
	<div className="page">
		<MapControl />
		<Controls controls={uistate.controls} />
	</div>


export { PageControl };
