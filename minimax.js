// Utility function to get the current timestamp in seconds
function getTimeInSeconds() {
    return Math.floor(Date.now() / 1000);
  }
  
  class Minimax {
    constructor(depth, evaluationFunction, expansionPolicy = (state, depth, cache) => state.getActions(), toCache = false, toAlphaBetaPrune = true) {
      this.depth = depth;
      this.evaluationFunction = evaluationFunction;
      this.expansionPolicy = expansionPolicy;
      this.toCache = toCache;
      this.cache = toCache ? {} : null;
      this.toAlphaBetaPrune = toAlphaBetaPrune;
    }
  
    search(state, resetCache = true) {
      if (resetCache && this.toCache) {
        this.cache = {};
      }
  
      let rootAlpha, rootBeta;
      if (this.toAlphaBetaPrune) {
        rootAlpha = Number.NEGATIVE_INFINITY;
        rootBeta = Number.POSITIVE_INFINITY;
      } else {
        rootAlpha = rootBeta = null;
      }
  
      const values = [];
      let value = Number.NEGATIVE_INFINITY;
      const actions = this.expansionPolicy(state, 0, this.cache);
  
      for (const action of actions) {
        const tempValue = this.minValue(state.takeAction(action), 1, rootAlpha, rootBeta);
        values.push(tempValue);
        value = Math.max(value, tempValue);
        if (rootAlpha !== null) {
          rootAlpha = Math.max(rootAlpha, value);
          if (value >= rootBeta) {
            break;
          }
        }
      }
  
      const bestIndices = values.reduce((indices, val, i) => (val === value ? [...indices, i] : indices), []);
      return actions[bestIndices[0]];
    }
  
    maxValue(state, depth, alpha = null, beta = null) {
      if (state.isTerminal() || depth === this.depth) {
        return this.evaluationFunction(state, depth);
      }
  
      if (this.toCache) {
        const cachedData = this.readCache(state, depth, alpha, beta);
        alpha = cachedData.alpha;
        beta = cachedData.beta;
        const value = cachedData.value;
        if (value !== null) {
          return value;
        }
      }
  
      let value = Number.NEGATIVE_INFINITY;
      const actions = this.expansionPolicy(state, depth, this.cache);
  
      for (const action of actions) {
        value = Math.max(value, this.minValue(state.takeAction(action), depth + 1, alpha, beta));
        if (alpha !== null && beta !== null) {
          if (value >= beta) {
            break;
          }
          alpha = Math.max(alpha, value);
        }
      }
  
      if (this.toCache) {
        this.storeCache(state, depth, alpha, beta, value);
      }
      return value;
    }
  
    minValue(state, depth, alpha = null, beta = null) {
      if (state.isTerminal() || depth === this.depth) {
        return this.evaluationFunction(state, depth);
      }
  
      if (this.toCache) {
        const cachedData = this.readCache(state, depth, alpha, beta);
        alpha = cachedData.alpha;
        beta = cachedData.beta;
        const value = cachedData.value;
        if (value !== null) {
          return value;
        }
      }
  
      let value = Number.POSITIVE_INFINITY;
      const actions = this.expansionPolicy(state, depth, this.cache);
  
      for (const action of actions) {
        value = Math.min(value, this.maxValue(state.takeAction(action), depth + 1, alpha, beta));
        if (alpha !== null && beta !== null) {
          if (value <= alpha) {
            break;
          }
          beta = Math.min(beta, value);
        }
      }
  
      if (this.toCache) {
        this.storeCache(state, depth, alpha, beta, value);
      }
      return value;
    }
  
    storeCache(state, depth, alpha, beta, value) {
        if (!alpha || !beta) {
          // No pruning happened
          this.cache[`${JSON.stringify(state)}-${depth}`] = { flag: "__eq__", value };
          return;
        }
    
        // Pruning might happen -> inaccurate value
        if (value <= alpha) {
          this.cache[`${JSON.stringify(state)}-${depth}`] = { flag: "__leq__", value: value };
        } else if (alpha < value < beta) {
          this.cache[`${JSON.stringify(state)}-${depth}`] = { flag: "__eq__",  value: value };
        } else if (beta <= value){
          this.cache[`${JSON.stringify(state)}-${depth}`] = { flag: "__geq__",  value: value };
        } else {
            throw new Error("Shouldn't get here.");
        }
      }
    
      readCache(state, depth, alpha, beta) {
        const cacheKey = `${JSON.stringify(state)}-${depth}`;
        if (!this.cache.hasOwnProperty(cacheKey)) {
          return { alpha, beta, value: null };
        }
    
        const cachedData = this.cache[cacheKey];
        if ((!alpha || !beta) && cachedData) {
          return { alpha, beta, value: cachedData.value};
        }
    
        // Pruning might happen
        let returnValue = null;
        if (cachedData){
            if(cachedData.flag === "__eq__"){
                returnValue = cachedData.value;
            } else if (cachedData.flag === "__leq__"){
                if (cachedData.value <= alpha){
                    returnValue = cachedData.value;
                } else if (alpha<cachedData.value && cachedData.value < beta){
                    beta = cachedData.value;
                }
            } else if (cachedData.flag === "__geq__"){
                if (beta <= cachedData.value){
                    returnValue = cachedData.value;
                } else if (alpha<cachedData.value && cachedData.value < beta){
                    alpha = cachedData.value;
                }
            }
        }
        return { alpha, beta, value: returnValue };
      }
    }

class MinimaxIDS extends Minimax {
    constructor(time, maxDepth, evaluationFunction, expansionPolicy = (state, depth, cache) => state.getActions(), toCache = false, toAlphaBetaPrune = true) {
        super(1, evaluationFunction, expansionPolicy, toCache, toAlphaBetaPrune);
        this.time = time;
        this.maxDepth = maxDepth;
    }

    search(state, resetCache = true) {
        if (resetCache && this.toCache) {
            this.cache = {};
        }

        this.depth = 1;
        // Divide by 2 because each level doubles the time. Try to stop as accuate as possible
        let endTime = getTimeInSeconds() + this.time/1000; 
        let action;

        while (getTimeInSeconds() < endTime && this.depth <= this.maxDepth) {
            action = super.search(state, true); // Don't reset cache between depths
            this.depth++;
        }

        if (!action){
            console.warn("Failed to find an action within time limit. Returning first available action.");
            return this.expansionPolicy(state, 0, this.cache)[0];
        } else {
            return action;
        }
        
    }
}

function linearExpansion(state, depth, cache) {
    return state.getActions();
}

function cacheExpansion(state, depth, cache) {
    if (!cache.size) return state.getActions();

    let sortedActions = [...state.getActions()].sort((actionA, actionB) => {
        let valueA = cache.get([state.takeAction(actionA), depth + 1])?.[1] || 0;
        let valueB = cache.get([state.takeAction(actionB), depth + 1])?.[1] || 0;
        return depth % 2 === 0 ? valueB - valueA : valueA - valueB;
    });

    return sortedActions;
}