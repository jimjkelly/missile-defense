/*

Calculations

This file contains functions meant to represent
individual computed variables and equations.

Each has a comment explaining its purpose,
inputs, and results.

*/


/* Lethal Radius

Purpose: The lethal radius of an an attacking warhead, radius
of the blast whithin which a target of hardness H will be
destroyed.

Inputs:
    - missileYield: Yield of attacking warhead in tons of TNT
    equivalent, provided by user for the ground burst offensive
    layer.
    - hardness: Hardness of defended target in PSI, provided by
    the user globally for the target.

Returns:
    - lethal radius in kilometers
*/
const LR = (missileYield, hardness) => {
    return 2.62 * 1852 * Math.cbrt(missileYield/1000) / Math.cbrt(hardness)
}

/* Single Shot Probability of Kill

Purpose: The probability of a kill for a single warhead

Inputs:
    - lr: Lethal radius. Computed by LR function.
    - cep: Circular error probable, radius within which an attacking
    warhead has a 50% chance of landing. Provided by user for the
    ground burst offensive layer.

Returns:
    - Probability
*/
const SSPK = (lr, cep) => {
    return 1 - Math.pow(.5, Math.pow((lr/cep), 2));
}

/* Terminal Kill Probability

Purpose: The probability of a kill accounting for reliability and
single shot probability of a kill

Inputs:
    - sspk: Single shot kill probability. Computed by SSPK function.
    - reliability: Reliability of attacking warhead (probability)

Returns:
    - Probability
*/
const TKP = (sspk, reliability) => {
    return sspk * reliability;
}

/* Defensive Layer

Purpose: Compute overall probability of defensive layer stopping
a generic offensive warhead.

Inputs:
    - layer: a dictionary containing the following keys:
        - tracking: Probability no common mode failure occurs to prevent
        the interceptor from fulfilling its mission
        - sspk: Single shot probability of kill for one interceptor at
        this layer.
        - interceptors: Number of interceptors committed per engagement.

Returns:
    - Probability
*/
const DefensiveLayer = (layer) => {
    return layer.tracking * (1-(Math.pow((1-layer.sspk), layer.interceptors)));
}


/* Offensive Layer TKP

Purpose: Compute TKP for an offensive layer, dependent on
whether it is a notional or ground burst offensive layer.

Inputs:
    - hardness: Hardness of defended target in PSI, provided by
    the user globally for the target.
    - layer: a dictionary containing the following keys:
        - type: "notional" or "ground-burst".
        - reliability: Reliability of attacking warhead (probability)
        - yield (ground burst only): Yield of attacking warhead
        in tons of TNT equivalent.
        - cep (ground burst only): Circular error probable, radius
        within which an attacking warhead has a 50% chance of landing.
        - sspk (notional only): Single shot kill probability.

Returns:
    - Probability

*/
const OffensiveLayer = (layer, hardness) => {
    if (layer.type === 'notional') {
        return TKP(layer.sspk, layer.reliability)
    } else if (layer.type === 'ground-burst') {
        return TKP(SSPK(LR(layer.yield, hardness), layer.cep), layer.reliability);
    } else {
        throw `Unknown offensive layer type: ${layer.type}`;
    }
}

/* Probability Warhead Succeeds

Purpose: Given an offensive TKP and defensive layers, compute
the probability that a warhead succeeds.

Discussion of Technique: The reduce function allows us to
easily multiply an arbitrary number of elements in array
against each other. By passing the tkp variable in as the
second argument, it provides the first value to multiply
against.  The function passed as the first argument to
reduce takes two arguments, one is the previous computed
value and the second is the current. So,

    [0.9,0.8,0.7].reduce((p,c) => p * (1 - c), 0.75)

would be the same as:

    0.75 * (1 - 0.9) = 0.075 then
    0.075 * (1 - 0.8) = 0.015 then
    0.015 * (1 - 0.7) = 0.0045

or

    0.75 * (1 - 0.9) * (1 - 0.8) * (1 - 0.7) = 0.0045
    TKP * (1 - P1) * (1 - P2) * (1 - P3)

Inputs:
    - tkp: terminal kill probability
    - defensiveLayers: An array of all defensive layer
    probabilities, as computed by passing each
    defensive layer to the DefensiveLayer function.

Returns:
    - Probability of warhead succeeding
*/
const PW = (tkp, defensivelayers) => {
    return defensivelayers.reduce((p, c) => p * (1 - c), tkp);
}


/* Models

Purpose: This data structure contains the various user-facing
models that can be selected by the end-user. An individual
model is an object literal (i.e. {}) that contains three keys:
name, description, and model. Name and description are strings,
while model is a function that takes three arguments,
which are the offensive layers, defensive laters, and target
information.

For example, the array is currently (minus the comment), as
follows:

const P0 = [
    {
        'name': 'Standard',
        'description': null,
        'model': (offensive, defensive, target) => {
            const defensiveLayers = defensive.length > 0 ? defensive.map(layer => DefensiveLayer(layer)) : [],
                  offensiveLayers = offensive.length > 0 ? offensive.filter(l => l.type).map(layer => OffensiveLayer(layer, target.hardness)) : null;

            return offensiveLayers ? offensiveLayers.reduce((p, c) => p * PW(c, defensiveLayers), 1) : null;
        }
    }
]

To add a new model that tells us there's always a 100% chance,
you would do the following:

const P0 = [
    {
        'name': 'New Hotness',
        'description': 'Like a fine aged cheese',
        'model': (offensive, defensive, target) => {
            return 1;
        }
    },
    {
        'name': 'Standard',
        'description': null,
        'model': (offensive, defensive, target) => {
            const defensiveLayers = defensive.length > 0 ? defensive.map(layer => DefensiveLayer(layer)) : [],
                  offensiveLayers = offensive.length > 0 ? offensive.filter(l => l.type).map(layer => OffensiveLayer(layer, target.hardness)) : null;

            return offensiveLayers ? offensiveLayers.reduce((p, c) => p * PW(c, defensiveLayers), 1) : null;
        }
    }
]

The model listed first will be the default, and they
will be ordered in the drop down in the order they are
listed here.  If there is only one entry, the dropdown
will disappear and the single model will be used.

If there are no entries, you are gonna have a bad time.

*/
const P0 = [
    {
        /* Probability that no warheads reach defended area

        Purpose: Given the offensive and defensive layers as well
        as the target information, return a probability that no
        warhead reaches the target.

        Dicussion of Technique: The overal technique here is to
        iterate through the layer data, computing the probability for
        each layer, and then use the results to compute the overall
        probability. The map function allows us to iterate over each
        item in an array, passing the item's data to a function, and
        storing the result in a new array. The filter function allows
        us to do what the name implies, pass a function which will
        be applied to each item in the array, and if the function
        returns true (or a truthy type value) it will include the
        item in the returned array. So in our case we check to ensure
        that the type value is set for the offensive layers.

        The last bit worth explaining is the syntax with the question
        mark and colon:

            predicate ? foo : bar

        This allows for us to return one value if the predicate evaluates
        to true and another if evaluates to false. For example, if there
        are no defensive layers set yet, we return an empty array.

        Inputs:
            - offensive: the offensive layers
            - defensive: the defensive layers
            - target: the target information. we specifically need the
            hardness value to be a key.

        Return:
            An overall probability.

        */
        'name': 'Standard',
        'description': null,
        'model': (offensive, defensive, target) => {
            const defensiveLayers = defensive.length > 0 ? defensive.map(layer => DefensiveLayer(layer)) : [],
                  offensiveLayers = offensive.length > 0 ? offensive.filter(l => l.type).map(layer => OffensiveLayer(layer, target.hardness)) : null;

            return offensiveLayers ? offensiveLayers.reduce((p, c) => p * PW(c, defensiveLayers), 1) : null;
        }
    }
]

// This allows other parts of the application to access these functions
export { P0, OffensiveLayer, DefensiveLayer };
