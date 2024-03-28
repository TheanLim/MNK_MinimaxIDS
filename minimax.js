class Minimax {
    constructor(depth, evaluationFunction, expansionPolicy = (state, depth, cache) => state.getActions(), toCache = false, toAlphaBetaPrune = true) {
      this.depth = depth;
      this.evaluationFunction = evaluationFunction;
      this.expansionPolicy = expansionPolicy;
      this.toCache = toCache;
      this.cache = toCache ? new Map() : null;
      this.toAlphaBetaPrune = toAlphaBetaPrune;
    }
  
    async search(state, resetCache = true) {
      if (resetCache && this.toCache) this.cache.clear();
      let rootAlpha = this.toAlphaBetaPrune ? Number.NEGATIVE_INFINITY : null;
      let rootBeta = this.toAlphaBetaPrune ? Number.POSITIVE_INFINITY : null;
  
      let value = Number.NEGATIVE_INFINITY;
      let actions = this.expansionPolicy(state, 0, this.cache);
      let bestAction = null;
  
      for (let action of actions) {
        let tempValue = await this.minValue(state.takeAction(action), 1, rootAlpha, rootBeta);
        if (tempValue > value) {
          value = tempValue;
          bestAction = action;
        }
        if (rootAlpha && value > rootAlpha) rootAlpha = value;
      }
  
      return bestAction;
    }
  
    async maxValue(state, depth, alpha, beta) {
      if (state.isTerminal() || depth === this.depth) return this.evaluationFunction(state, depth);
  
      let value = Number.NEGATIVE_INFINITY;
      let actions = this.expansionPolicy(state, depth, this.cache);
      for (let action of actions) {
        value = Math.max(value, await this.minValue(state.takeAction(action), depth + 1, alpha, beta));
        if (alpha && beta && value >= beta) break;
        if (alpha) alpha = Math.max(alpha, value);
      }
  
      if (this.toCache) this.storeCache(state, depth, alpha, beta, value);
      return value;
    }
  
    async minValue(state, depth, alpha, beta) {
      if (state.isTerminal() || depth === this.depth) return this.evaluationFunction(state, depth);
  
      let value = Number.POSITIVE_INFINITY;
      let actions = this.expansionPolicy(state, depth, this.cache);
      for (let action of actions) {
        value = Math.min(value, await this.maxValue(state.takeAction(action), depth + 1, alpha, beta));
        if (alpha && beta && value <= alpha) break;
        if (beta) beta = Math.min(beta, value);
      }
  
      if (this.toCache) this.storeCache(state, depth, alpha, beta, value);
      return value;
    }
  
    storeCache(state, depth, alpha, beta, value) {
      if (!alpha || !beta) {
        this.cache.set([state, depth], ["__eq__", value]);
        return;
      }
  
      let flag;
      if (value <= alpha) flag = "__leq__";
      else if (value >= beta) flag = "__geq__";
      else flag = "__eq__";
  
      this.cache.set([state, depth], [flag, value]);
    }
  }
  
  class MinimaxIDS extends Minimax {
    constructor(time, maxDepth, evaluationFunction, expansionPolicy = (state, depth, cache) => state.getActions(), toCache = false, toAlphaBetaPrune = true) {
      super(1, evaluationFunction, expansionPolicy, toCache, toAlphaBetaPrune);
      this.time = time;
      this.maxDepth = maxDepth;
    }
  
    async search(state, resetCache = true) {
      if (resetCache && this.toCache) this.cache.clear();
  
      let action = null;
      let endTime = Date.now() + this.time;
      for (this.depth = 1; this.depth <= this.maxDepth; this.depth++) {
        action = await this._search(state);
        if (Date.now() >= endTime) break;
      }
      return action;
    }
  
    async _search(state) {
      let queueOfActions = [];
      let endTime = Date.now() + this.time;
  
      while (Date.now() < endTime && this.depth <= this.maxDepth) {
        let action = await super.search(state, false);
        queueOfActions.push(action);
        this.depth++;
      }
  
      return queueOfActions.pop();
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
  