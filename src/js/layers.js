/*

This file contains mostly display components
for specification of data for offensive and
defensive layers.

*/

import React from 'react';
import { callAction, reducerMap } from './store';
import { OffensiveLayer as OffensiveCalc, DefensiveLayer as DefensiveCalc } from './calculations';
import { EditableText, FormInfo } from './ui';
import { dashLayer, colors } from './map';
import { round } from './utils';


// Here we add reducer functions to control
// how layer and target data is added and
// modified in the store.
Object.assign(reducerMap, {
    UPDATE_TARGET: (state, action) => {
        return Object.assign({}, state, {
            target: Object.assign({}, state.target, action.data)
        });
    },
    UPDATE_LAYER: (state, action) => {
        return Object.assign({}, state, {
            layers: [
                ...state.layers.slice(0, action.data.index),
                Object.assign(
                    {},
                    state.layers[action.data.index],
                    action.data.layer
                ),
                ...state.layers.slice(action.data.index + 1)
            ]
        });
    },
    ADD_LAYER: (state, action) => {
        return Object.assign({}, state, {
            layers: [
                ...state.layers,
                action.data
            ]
        });
    },
    REMOVE_LAYER: (state, action) => {
        const layers = state.layers.filter((e, i) => i !== action.data.index);
        const active = state.active.filter((e) => e !== action.data.index).map(c =>
            layers.indexOf(state.layers[c])
        );
        return Object.assign({}, state, {
            active,
            layers
        });
    },
    UPDATE_ACTIVE_LAYERS: (state, action) => {
        return Object.assign({}, state, {
            active: action.data
        })
    }
});

// A generic layer container, which shows an editable
// name, a button to delete it, and its children.
const Layer = ({ index, type, name, children }) =>
    <div className="layer">
        <EditableText
            text={name}
            action={(element) => callAction('UPDATE_LAYER', {
                index,
                layer: { name: element.value }
            })}
        />
        <i className="layer-button fa fa-minus" onClick={
            () => callAction('REMOVE_LAYER', { index, type })
        }></i>
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style={{height: "15px", marginLeft: "-10px", width: "100%"}}>
            <line style={ {strokeDasharray: dashLayer(index), fill: colors[type], stroke: colors[type]}} x1="10" y1="10" x2="190" y2="10" />
        </svg>
        {children}
    </div>


// A range field
const Range = ({ index, range }) =>
    <div className="range">
        <label>
            Range (m):
            <EditableText
                text={range || 0}
                action={element => callAction('UPDATE_LAYER', {
                    index,
                    layer: { range: element.value }
                })}
                validate={e => (0 <= e.value && e.value == parseInt(e.value, 10))}
            />
        </label>
        <FormInfo>
            <div>
                Range
            </div>
            <div>
                Must be an integer greater than or equal to 1.
            </div>
        </FormInfo>
    </div>


// An SSPK field
const SSPK = ({ index, sspk }) =>
    <div className="sspk">
        <label>
            SSPK:
            <EditableText
                text={sspk || 0}
                action={element => callAction('UPDATE_LAYER', {
                    index,
                    layer: { sspk: element.value }
                })}
                validate={e => (0 <= e.value && e.value <= 1)}
            />
        </label>
        <FormInfo>
            <div>
                Single Shot Probability of Kill<br />
                for one interceptor at Layer L.
            </div>
            <div>
                Must be a value between 0 and 1, inclusive.
            </div>
        </FormInfo>
    </div>


// A field for the number of interceptors
const Interceptors = ({ index, interceptors }) =>
    <div className="interceptors">
        <label>
            Interceptors per Target:
            <EditableText
                text={interceptors || 0}
                action={element => callAction('UPDATE_LAYER', {
                    index,
                    layer: { interceptors: element.value }
                })}
                validate={e => (0 <= e.value && e.value == parseInt(e.value, 10))}
            />
        </label>
        <FormInfo>
            <div>
                Number of Interceptors in Layer per Target
            </div>
            <div>
                Must be an integer greater than or equal to 1.
            </div>
        </FormInfo>
    </div>


// A field for tracking probability
const TrackingProbability = ({ index, tracking }) =>
    <div className="tracking-probability">
        <label>
            Tracking Probability:
            <EditableText
                text={tracking || 0}
                action={element => callAction('UPDATE_LAYER', {
                    index,
                    layer: { tracking: element.value }
                })}
                validate={e => (0 <= e.value && e.value <= 1)}
            />
        </label>
        <FormInfo>
            <div>
                Probability of No Common Mode Failure
            </div>
            <div>
                Must be a value between 0 and 1, inclusive.
            </div>
        </FormInfo>
    </div>


// A field for reliability
const Reliability = ({ index, reliability }) =>
    <div className="reliability">
        <label>
            Reliability:
            <EditableText
                text={reliability || 0}
                action={element => callAction('UPDATE_LAYER', {
                    index,
                    layer: { reliability: element.value }
                })}
                validate={e => (0 <= e.value && e.value <= 1)}
            />
        </label>
        <FormInfo>
            <div>
                Reliability of Attacking Warhead
            </div>
            <div>
                Must be a value between 0 and 1, inclusive.
            </div>
        </FormInfo>
    </div>


// A field for yield
const Yield = ({ index, missileYield }) =>
    <div className="yield">
        <label>
            Yield (Kilotons):
            <EditableText
                text={missileYield || 0}
                action={element => callAction('UPDATE_LAYER', {
                    index,
                    layer: { yield: element.value }
                })}
                validate={e => (0 <= e.value && e.value == parseInt(e.value, 10))}
            />
        </label>
        <FormInfo>
            <div>
                Yield of Attacking Warhead in Kilotons
            </div>
            <div>
                Must be an integer greater than or equal to 1.
            </div>
        </FormInfo>
    </div>


// A field for CEP
const CEP = ({ index, cep }) =>
    <div className="cep">
        <label>
            CEP (m):
            <EditableText
                text={cep || 0}
                action={element => callAction('UPDATE_LAYER', {
                    index,
                    layer: { cep: element.value }
                })}
                validate={e => (0 <= e.value && e.value == parseInt(e.value, 10))}
            />
        </label>
        <FormInfo>
            <div>
                Circular Error Probable (in meters)
            </div>
            <div>
                The radius within which an attacking warhead<br />
                has a 50% chance of landing.
            </div>
            <div>
                Must be an integer greater than or equal to 1.
            </div>
        </FormInfo>
    </div>



// A series of fields for configuring an offensive layer as ground burst
const GroundBurst = ({ index, layerData }) =>
    <div className="ground-burst">
        <Range index={index} type="offensive" range={layerData.range} />
        <Yield index={index} missileYield={layerData.yield} />
        <Reliability index={index} reliability={layerData.reliability} />
        <CEP index={index} cep={layerData.cep} />
    </div>


// A series of fields for configuring an offensive layer as notional
const Notional = ({ index, layerData }) =>
    <div className="notional">
        <Range index={index} type="offensive" range={layerData.range} />
        <SSPK index={index} type="offensive" sspk={layerData.sspk} />
        <Reliability index={index} reliability={layerData.reliability} />
    </div>


// A generic probability display component
const Probability = ({ a, b, value }) =>
    <span className="probability">
        P({a}{ b ? `, ${b}` : null}): {round(value)}
    </span>


// A widget for selecting offensive type
const OffensiveType = ({ index, type }) =>
    <div className="offensive-type">
        <select name="offensive-type" value={type || 'default'} onChange={(e) => callAction('UPDATE_LAYER', {
            index,
            layer: { offensiveType: e.currentTarget.value }
        })}>
            <option value="default" disabled hidden>Select an Offensive Type</option>
            <option value="notional">Notional</option>
            <option value="ground-burst">Ground Burst</option>
        </select>
    </div>


// An offensive layer widget
const OffensiveLayer = ({ index, type, layerData, target }) =>
    <Layer index={index} type={type} name={layerData.name} >
        <OffensiveType index={index} type={layerData.offensiveType} />
        { layerData.offensiveType == 'notional'
            ? <Notional index={index} layerData={layerData} />
            : layerData.offensiveType == 'ground-burst'
            ? <GroundBurst index={index} layerData={layerData} />
            : null
        }
        { layerData.offensiveType && !isNaN(OffensiveCalc(layerData, target.hardness))
            ? <Probability
                a={layerData.name}
                b="unopposed"
                value={OffensiveCalc(layerData, target.hardness)}
              />
            : null
        }
    </Layer>


// A defensive layer widget
const DefensiveLayer = ({ index, type, layerData }) =>
    <Layer index={index} type={type} name={layerData.name} >
        <Range index={index} type="defensive" range={layerData.range} />
        <SSPK index={index} type="defensive" sspk={layerData.sspk} />
        <Interceptors index={index} interceptors={layerData.interceptors} />
        <TrackingProbability index={index} tracking={layerData.tracking} />
        { !isNaN(DefensiveCalc(layerData))
            ? <Probability a={layerData.name} value={DefensiveCalc(layerData)} />
            : null
        }
    </Layer>


// Target configuraiton widget
const Target = ({ target }) => {
    const { latitude, longitude, hardness } = target;
    return <div className="target">
        <label>Target Information:</label>
        <div>
            Latitude: <EditableText
                text={latitude}
                action={(element) => callAction(
                    'UPDATE_TARGET',
                    { latitude: Number(element.value) }
                )}
                validate={e => (-90 <= e.value && e.value <= 90)}
            />
        </div>
        <div>
            Longitude: <EditableText
                text={longitude}
                action={(element) => callAction(
                    'UPDATE_TARGET',
                    { longitude: Number(element.value) }
                )}
                validate={e => (-180 <= e.value && e.value <= 180)}
            />
        </div>
        <div>
            Hardness (PSI): <EditableText
                text={hardness}
                action={(element) => callAction(
                    'UPDATE_TARGET',
                    { hardness: element.value }
                )}
                validate={e => (0 <= e.value && e.value == parseInt(e.value, 10))}
            />
            <FormInfo>
                <div>
                    Hardness of Buildings in Target Area in PSI
                </div>
                <div>
                    Must be an integer greater than or equal to 1.
                </div>
            </FormInfo>
        </div>
    </div>
}

// This allows other parts of the application to access these functions
export { OffensiveLayer, DefensiveLayer, Target, Probability };
