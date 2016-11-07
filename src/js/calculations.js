import React from 'react';
import { logger } from './utils';


const LR = (missileYield, hardness) => {
	return 2.63 * 1852 * Math.cbrt(missileYield/1000) / Math.cbrt(hardness)
}

const SSPK = (lr, cep) => {
	return 1 - .5^((lr/cep)^2);
}

const TKP = (sspk, reliability) => {
	return sspk * reliability;
}

const DefensiveLayer = (tracking, sspk, interceptors ) => {
	return tracking * (1-((1-sspk)^interceptors));
}

const OffensiveLayer = (layer, defensivelayers) => {
	var tkp;

	// TODO: Hardness is hardcoded
	if (layer.type === 'notional') {
		tkp = TKP(layer.sspk, layer.reliability)
	} else if (layer.type === 'ground-burst') {
		tkp = TKP(SSPK(LR(layer.missileYield, '22'), layer.cep), layer.reliability);
	} else {
		logger('Unknown offensive layer type: ', layer.type);
	}

	return (1 - defensivelayers.reduce((p, c) => p * c, tkp)) ^ layer.number;
}

const Calculate = (offensive, defensive) => {
	const defensiveLayers = defensive.length > 0 ? defensive.map(layer => DefensiveLayer(layer.tracking, layer.sspk, layer.interceptors)) : [],
		  offensiveLayers = (offensive.length > 0 && defensive.length > 0) ? offensive.map(layer => OffensiveLayer(layer, defensiveLayers)) : null,
		  overallProbability = offensiveLayers ? offensiveLayers.reduce((p, c) => p + c) : null;

	return overallProbability;
}

const Calculations = ({ controls }) =>
	<div className="results">
		Probability: {Calculate(controls.get('offensive').toJS(), controls.get('defensive').toJS())}
	</div>


export { Calculations };
