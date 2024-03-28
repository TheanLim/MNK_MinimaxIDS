/**
 * An MNK Action.
 * An action is characterized by placing a player's sign (such as "X")
 * at (m,n) coordinate of the board.
 */
class MNKAction {
    constructor(playerSign, m, n) {
      this.playerSign = playerSign;
      this.m = m;
      this.n = n;
    }
  
    toString() {
      return `(${this.m}, ${this.n})`;
    }
  
    equals(other) {
      return this.constructor === other.constructor && this.playerSign === other.playerSign && this.m === other.m && this.n === other.n;
    }
  
    hash() {
      return JSON.stringify({ playerSign: this.playerSign, m: this.m, n: this.n });
    }
  }
  
/**
 * An MNK Game State.
 * The Tic-Tac-Toe game is an example of m=n=k=3.
 */
class MNK {
  constructor(m, n, k, playerSigns, emptySign = "-") {
    if (k > Math.max(m, n)) {
      throw new Error("k has to be smaller or equal to max (m, n)");
    }
    if (playerSigns.includes(emptySign)) {
      throw new Error("Use different signs for players and default empty cell");
    }
    this.m = m;
    this.n = n;
    this.k = k;
    this.playerSigns = [...playerSigns];
    // The first element this.playerSignsRotation represents the currentPlayer
    // this.playerSignsRotation is a circular queue: the player that took an action
    // is placed as the end of the queue.
    this.playerSignsRotation = [...playerSigns];
    this.emptySign = emptySign;
    this.lastAction = null;
    // Whether it is a terminal state. This is stored to prevent recomputation.
    this._isTerminal = false;
    this.remainingMoves = m * n;
    // Store utilities in the form of tuple(utilityPlayer1, utilityPlayer2,...)
    this.utility = Array(this.playerSigns.length).fill(0); // draw by default
    // Board of m*n filled with emptySign
    this.board = Array.from({ length: m }, () => Array(n).fill(emptySign));
    this.winningSequence = []; // important for storing the winning sequence
  }

  getBoard() {
    // Returns a deep-copied board to prevent accidental modification
    return JSON.parse(JSON.stringify(this.board));
  }

  getPlayersSigns() {
    // Returns a list of player signs
    return this.playerSigns;
  }

  getCurrentPlayerSign() {
    // The first element this.playerSignsRotation represents the currentPlayer
    return this.playerSignsRotation[0];
  }

  getActions() {
    // Returns available actions to take.
    // Returns all the cells with emptySign
    const curPlayer = this.getCurrentPlayerSign();
    const actions = [];
    for (let i = 0; i < this.m; i++) {
      for (let j = 0; j < this.n; j++) {
        if (this.board[i][j] === this.emptySign) {
          actions.push(new MNKAction(curPlayer, i, j));
        }
      }
    }
    return actions;
  }

  isLegalAction(action) {
    return action.m >= 0 && action.m < this.m &&
      action.n >= 0 && action.n < this.n &&
      action.playerSign === this.getCurrentPlayerSign() &&
      this.board[action.m][action.n] === this.emptySign;
  }

  takeAction(action, preserveState = true) {
    // Take an action and returns the resulting state.
    // If preserveState, The original state is NOT altered.
    // Only allows taking action on/if:
    // a) Non-terminal state
    // b) Empty Cell
    // c) It is the current player's turn
    // After taking an action, the playerSignsRotation is rotated,
    // remainingMoves, and lastAction are updated accordingly.
    if (this.isTerminal()) {
      console.log("Cannot take actions in a terminal state");
      throw new Error("Cannot take actions in a terminal state.");
    }
    if (!this.isLegalAction(action)) {
      throw new Error("Illegal Action.", action);
    }
    const stateCopy = preserveState ? new MNK(this.m, this.n, this.k, this.playerSigns, this.emptySign) : this;
    stateCopy.board = this.getBoard(); // Deep copy of the board
    stateCopy.lastAction = this.lastAction;
    stateCopy._isTerminal = this._isTerminal;
    stateCopy.remainingMoves = this.remainingMoves;
    stateCopy.playerSignsRotation = [...this.playerSignsRotation];
    stateCopy.utility = [...this.utility];
    stateCopy.winningSequence = this.winningSequence;

    stateCopy.board[action.m][action.n] = action.playerSign;
    // Rotate the Players Sign
    stateCopy.playerSignsRotation.shift();
    stateCopy.playerSignsRotation.push(action.playerSign);
    // End Rotate the Players Sign
    stateCopy.remainingMoves--;
    stateCopy.lastAction = action;
    return stateCopy;
  }

  isTerminal() {
      // Whether it is a terminal state.
      // Returns true if there's a winner or there's no remaining moves
  
      if (this._isTerminal) {
        return true;
      }
  
      if (!this.lastAction) {
        // No action taken yet
        return false;
      }
  
      // Check if there's a winner
      if (this.checkWinner()) {
        this._isTerminal = true;
        return true;
      }
  
      // No moves remaining
      if (this.remainingMoves <= 0) {
        this._isTerminal = true;
        return true;
      }
  
      return false;
  }
    

  checkWinner() {
    const encodeUtility = () => {
        const utility = [];
        for (const sign of this.playerSigns) {
            if (sign === this.lastAction.playerSign) {
                utility.push(1);
            } else {
                utility.push(-1);
            }
        }
        this.utility = utility;
    };

    const lastAction = this.lastAction;
    if (!lastAction) return false;

    const lastPlayerSign = lastAction.playerSign;
    const leftMost = Math.max(0, lastAction.n - (this.k - 1));
    const rightMost = Math.min(this.n - 1, lastAction.n + (this.k - 1));
    const topMost = Math.max(0, lastAction.m - (this.k - 1));
    const bottomMost = Math.min(this.m - 1, lastAction.m + (this.k - 1));

    let winningSequence = [];

    // Check row
    let runningK = 0;
    for (let l = leftMost; l <= rightMost; l++) {
        runningK = this.board[lastAction.m][l] === lastPlayerSign ? runningK + 1 : 0;
        if (runningK === this.k) {
            for (let i = l - this.k + 1; i <= l; i++) {
                winningSequence.push(`${lastAction.m},${i}`);
            }
            encodeUtility();
            this._isTerminal = true;
            this.winningSequence = winningSequence;
            return true;
        }
    }

    // Check column
    runningK = 0;
    for (let top = topMost; top <= bottomMost; top++) {
        runningK = this.board[top][lastAction.n] === lastPlayerSign ? runningK + 1 : 0;
        if (runningK === this.k) {
            for (let i = top - this.k + 1; i <= top; i++) {
                winningSequence.push(`${i},${lastAction.n}`);
            }
            encodeUtility();
            this._isTerminal = true;
            this.winningSequence = winningSequence;
            return true;
        }
    }

    // Check Diag1
    let minDist = Math.min(lastAction.m - topMost, lastAction.n - leftMost);
    runningK = 0;
    for (let top = lastAction.m - minDist, l = lastAction.n - minDist; top <= bottomMost && l <= rightMost; top++, l++) {
        runningK = this.board[top][l] === lastPlayerSign ? runningK + 1 : 0;
        if (runningK === this.k) {
            for (let i = 0; i < this.k; i++) {
                winningSequence.push(`${top - i},${l - i}`);
            }
            encodeUtility();
            this._isTerminal = true;
            this.winningSequence = winningSequence;
            return true;
        }
    }

    // Check Diag2
    minDist = Math.min(lastAction.m - topMost, rightMost - lastAction.n);
    runningK = 0;
    for (let top = lastAction.m - minDist, r = lastAction.n + minDist; top <= bottomMost && r >= leftMost; top++, r--) {
        runningK = this.board[top][r] === lastPlayerSign ? runningK + 1 : 0;
        if (runningK === this.k) {
            for (let i = 0; i < this.k; i++) {
                winningSequence.push(`${top - i},${r + i}`);
            }
            encodeUtility();
            this._isTerminal = true;
            this.winningSequence = winningSequence;
            return true;
        }
    }

    return false;
  }


  getUtility() {
    // Get the utility from this game state.
    // Reward comes from winning.
    this.checkWinner();
    return this.utility;
  }

  toString() {
    // Prints the 2D board properly so that each
    // row is separated (newline) from each other
    return this.board.map(row => row.join(' ')).join('\n');
  }

  equals(other) {
    return this.constructor === other.constructor && JSON.stringify(this.board) === JSON.stringify(other.board);
  }
}
  