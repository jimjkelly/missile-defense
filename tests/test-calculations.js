
test('tests notional offensive layer', () => {
    const calculations = require('../src/js/calculations.js');

    expect(calculations.OffensiveLayer(
        {
            type: 'notional',
            sspk: 0.9,
            reliability: 0.9
        },
        10
    )).toBe(0.81);
});

test('tests ground burst offensive layer', () => {
    const calculations = require('../src/js/calculations.js');

    expect(calculations.OffensiveLayer(
        {
            type: 'ground-burst',
            yield: 1000,
            reliability: 0.9,
            cep: 10
        },
        10
    )).toBe(0.9);
});

test('tests defensive layer', () => {
    const calculations = require('../src/js/calculations.js');

    expect(calculations.DefensiveLayer(
        {
            interceptors: 2,
            tracking: 0.9,
            sspk: 0.9
        }
    )).toBe(0.891);
});

test('test p0 with notional offense', () => {
    const calculations = require('../src/js/calculations.js');

    expect(calculations.P0(
        [
            {
                number: 2,
                reliability: 0.9,
                sspk: 0.9,
                type: 'notional'
            }
        ],
        [
            {
                interceptors: 1,
                range: 2,
                sspk: 0.9,
                tracking: 0.9
            }
        ],
        {
            hardness: 10
        }
    )).toBe(0.15389999999999995)
});

test('test p0 with ground burst offense', () => {
    const calculations = require('../src/js/calculations.js');

    expect(calculations.P0(
        [
            {
                number: 2,
                cep: 100,
                reliability: 0.9,
                yield: 1000,
                type: 'ground-burst'
            }
        ],
        [
            {
                interceptors: 1,
                range: 2,
                sspk: 0.9,
                tracking: 0.9
            }
        ],
        {
            hardness: 10
        }
    )).toBe(0.17099999999999996)
});