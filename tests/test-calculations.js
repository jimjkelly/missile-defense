
test('tests sspk', () => {
    const calculations = require('../src/js/calculations.js');

    expect(calculations.SSPK(
        calculations.LR(750, 700),
        900
    )).toBeCloseTo(0.19019, 5);
})

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

    expect(calculations.OffensiveLayer(
        {
            type: 'notional',
            sspk: 0.19019,
            reliability: 0.8
        },
        700
    )).toBe(0.152152);
});

test('tests ground burst offensive layer', () => {
    const calculations = require('../src/js/calculations.js');

    expect(calculations.OffensiveLayer(
        {
            type: 'ground-burst',
            yield: 750,
            reliability: 0.75,
            cep: 900
        },
        200
    )).toBeCloseTo(0.2888312680363119, 12);
});

test('offensive layer equivalency', () => {
    const calculations = require('../src/js/calculations.js');

    /* NOTE: These compute out to the following values:
        notional:
          0.152152
        ground-burst:
          0.15215494491130396
    */

    expect(calculations.OffensiveLayer(
        {
            type: 'notional',
            sspk: 0.19019,
            reliability: 0.8
        },
        700
    )).toBeCloseTo(calculations.OffensiveLayer(
        {
            type: 'ground-burst',
            yield: 750,
            reliability: 0.8,
            cep: 900
        },
        700
    ), 5);
})

test('tests defensive layer', () => {
    const calculations = require('../src/js/calculations.js');

    expect(calculations.DefensiveLayer(
        {
            interceptors: 2,
            tracking: 0.9,
            sspk: 0.9
        }
    )).toBe(0.891);

    expect(calculations.DefensiveLayer(
        {
            interceptors: 2,
            sspk: 0.65,
            tracking: 0.5
        }
    )).toBeCloseTo(0.43875, 5);
});

test('tests pw', () => {
    const calculations = require('../src/js/calculations.js');

    expect(calculations.PW(
        calculations.OffensiveLayer({
            number: 1,
            reliability: 0.8,
            sspk: 0.19019,
            type: 'notional'
        }),
        [calculations.DefensiveLayer(
            {
                interceptors: 2,
                sspk: 0.65,
                tracking: 0.5
            }
        )]
    )).toBeCloseTo(0.085395, 6);
})

test('test p0 with notional offense', () => {
    const calculations = require('../src/js/calculations.js');

    expect(calculations.P0[0].model(
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
    )).toBeCloseTo(0.8461, 4)
});

test('test p0 with ground burst offense', () => {
    const calculations = require('../src/js/calculations.js');

    expect(calculations.P0[0].model(
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
    )).toBeCloseTo(0.8290, 4);
});

test('p0 over multiple warheads', () => {
    const calculations = require('../src/js/calculations.js');

    expect(calculations.P0[0].model(
        [
            {
                number: 1,
                reliability: 0.8,
                sspk: 0.19019,
                type: 'notional'
            }
        ],
        [
            {
                interceptors: 2,
                sspk: 0.65,
                tracking: 0.5
            }
        ],
        {
            hardness: 700
        }
    )).toBeCloseTo(0.9146, 4);

    expect(calculations.P0[0].model(
        [
            {
                number: 1,
                reliability: 0.8,
                sspk: 0.19019,
                type: 'notional'
            },
            {
                number: 1,
                reliability: 0.8,
                sspk: 0.19019,
                type: 'notional'
            }
        ],
        [
            {
                interceptors: 2,
                sspk: 0.65,
                tracking: 0.5
            }
        ],
        {
            hardness: 700
        }
    )).toBeCloseTo(0.8365, 4);

    expect(calculations.P0[0].model(
        [
            {
                number: 1,
                reliability: 0.8,
                sspk: 0.19019,
                type: 'notional'
            },
            {
                number: 1,
                reliability: 0.8,
                sspk: 0.19019,
                type: 'notional'
            },
            {
                number: 1,
                reliability: 0.8,
                sspk: 0.19019,
                type: 'notional'
            }
        ],
        [
            {
                interceptors: 2,
                sspk: 0.65,
                tracking: 0.5
            }
        ],
        {
            hardness: 700
        }
    )).toBeCloseTo(0.7651, 4);

    expect(calculations.P0[0].model(
        [
            {
                number: 1,
                reliability: 0.8,
                sspk: 0.19019,
                type: 'notional'
            },
            {
                number: 1,
                reliability: 0.8,
                sspk: 0.19019,
                type: 'notional'
            },
            {
                number: 1,
                reliability: 0.8,
                sspk: 0.19019,
                type: 'notional'
            },
            {
                number: 1,
                reliability: 0.8,
                sspk: 0.19019,
                type: 'notional'
            }
        ],
        [
            {
                interceptors: 2,
                sspk: 0.65,
                tracking: 0.5
            }
        ],
        {
            hardness: 700
        }
    )).toBeCloseTo(0.6997, 4);
})
