
const LR = (missileYield, hardness) => {
    return 2.63 * 1852 * Math.cbrt(missileYield/1000) / Math.cbrt(hardness)
}

const SSPK = (lr, cep) => {
    return 1 - Math.pow(.5, Math.pow((lr/cep), 2));
}

const TKP = (sspk, reliability) => {
    return sspk * reliability;
}

const DefensiveLayer = (layer) => {
    return layer.tracking * (1-(Math.pow((1-layer.sspk), layer.interceptors)));
}

const OffensiveLayer = (layer, hardness) => {
    if (layer.type === 'notional') {
        return TKP(layer.sspk, layer.reliability)
    } else if (layer.type === 'ground-burst') {
        return TKP(SSPK(LR(layer.yield, hardness), layer.cep), layer.reliability);
    } else {
        throw `Unknown offensive layer type: ${layer.type}`;
    }
}

const PW = (tkp, defensivelayers) => {
    return defensivelayers.reduce((p, c) => p * c, tkp);
}

const P0 = (offensive, defensive, target) => {
    const defensiveLayers = defensive.length > 0 ? defensive.map(layer => 1 - DefensiveLayer(layer)) : [],
          offensiveLayers = offensive.length > 0 ? offensive.filter(l => l.type).map(layer => OffensiveLayer(layer, target.hardness)) : null;

    return offensiveLayers ? offensiveLayers.reduce((p, c) => p * PW(c, defensiveLayers), 1) : null; 
}

export { P0, OffensiveLayer, DefensiveLayer };
