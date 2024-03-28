// prototype.js

class Action {
    // This class can remain empty for now
  }
  
  class State {
    getActions() {
      // This method should return an array of possible Actions
      throw new Error("getActions() not implemented");
    }
  
    takeAction(action, preserveState = true) {
      // This method should return a new State after taking the provided Action
      throw new Error("takeAction() not implemented");
    }
  
    isTerminal() {
      // This method should return a boolean indicating if the State is terminal
      throw new Error("isTerminal() not implemented");
    }
  
    getUtility() {
      // This method should return the utility value of the State
      throw new Error("getUtility() not implemented");
    }
  }
  
  class Search {
    search(state, ...args) {
      // This method should return an Action based on the provided State
      throw new Error("search() not implemented");
    }
  }