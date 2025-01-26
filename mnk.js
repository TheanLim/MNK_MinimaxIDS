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

class MNK {
  constructor(m, n, k, playerSigns, emptySign = "-", aiPlayerSign) {
      if (k > Math.max(m, n)) {
          throw new Error("k has to be smaller or equal to max (m, n)");
      }
      if (playerSigns.includes(emptySign)) {
          throw new Error("Use different signs for players and default empty cell");
      }
      this.m = m;
      this.n = n;
      this.k = k;
      this.aiPlayerSign = aiPlayerSign;
      this.playerSigns = [...playerSigns];
      this.playerSignsRotation = [...playerSigns];
      this.emptySign = emptySign;
      this.lastAction = null;
      this._isTerminal = false;
      this.remainingMoves = m * n;
      this.utility = Array(this.playerSigns.length).fill(0);
      this.winningSequence = [];
      this.bitboards = new Map();
      playerSigns.forEach(sign => this.bitboards.set(sign, 0n));
      this.winningMasks = this.generateWinningMasks();
      this._cacheKey = null;
      this._bitmask = 0n;
  }

  get board() {
      const board = [];
      for (let i = 0; i < this.m; i++) {
          const row = [];
          for (let j = 0; j < this.n; j++) {
              const pos = i * this.n + j;
              let sign = this.emptySign;
              for (const [player, bitboard] of this.bitboards) {
                  if ((bitboard & (1n << BigInt(pos))) !== 0n) {
                      sign = player;
                      break;
                  }
              }
              row.push(sign);
          }
          board.push(row);
      }
      return board;
  }

  generateWinningMasks() {
      const masks = [];
      const addMasks = (startI, startJ, di, dj) => {
          let mask = 0n;
          const positions = [];
          for (let d = 0; d < this.k; d++) {
              const i = startI + di * d;
              const j = startJ + dj * d;
              const pos = i * this.n + j;
              mask |= 1n << BigInt(pos);
              positions.push(`${i},${j}`);
          }
          masks.push({ mask, positions });
      };

      // Horizontal
      for (let i = 0; i < this.m; i++) {
          for (let j = 0; j <= this.n - this.k; j++) {
              addMasks(i, j, 0, 1);
          }
      }

      // Vertical
      for (let j = 0; j < this.n; j++) {
          for (let i = 0; i <= this.m - this.k; i++) {
              addMasks(i, j, 1, 0);
          }
      }

      // Diagonal down-right
      for (let i = 0; i <= this.m - this.k; i++) {
          for (let j = 0; j <= this.n - this.k; j++) {
              addMasks(i, j, 1, 1);
          }
      }

      // Diagonal down-left
      for (let i = 0; i <= this.m - this.k; i++) {
          for (let j = this.k - 1; j < this.n; j++) {
              addMasks(i, j, 1, -1);
          }
      }

      return masks;
  }

  getCurrentPlayerSign() {
      return this.playerSignsRotation[0];
  }

  getActions() {
      const curPlayer = this.getCurrentPlayerSign();
      const combined = Array.from(this.bitboards.values()).reduce((acc, bb) => acc | bb, 0n);
      const actions = [];
      for (let i = 0; i < this.m; i++) {
          for (let j = 0; j < this.n; j++) {
              const pos = i * this.n + j;
              if ((combined & (1n << BigInt(pos))) === 0n) {
                  actions.push(new MNKAction(curPlayer, i, j));
              }
          }
      }
      return actions;
  }

  isLegalAction(action) {
      if (!action) return false;
      const pos = action.m * this.n + action.n;
      const combined = Array.from(this.bitboards.values()).reduce((acc, bb) => acc | bb, 0n);
      return action.m >= 0 && action.m < this.m &&
          action.n >= 0 && action.n < this.n &&
          action.playerSign === this.getCurrentPlayerSign() &&
          (combined & (1n << BigInt(pos))) === 0n;
  }

  takeAction(action, preserveState = true) {
      this._cacheKey = null;
      if (this.isTerminal()) {
          throw new Error("Cannot take actions in a terminal state.");
      }
      if (!this.isLegalAction(action)) {
          throw new Error("Illegal Action.");
      }

      const stateCopy = preserveState ? new MNK(this.m, this.n, this.k, this.playerSigns, this.emptySign, this.aiPlayerSign) : this;
      stateCopy.playerSignsRotation = [...this.playerSignsRotation];
      stateCopy.remainingMoves = this.remainingMoves;
      stateCopy.lastAction = this.lastAction;
      stateCopy._isTerminal = this._isTerminal;
      stateCopy.utility = [...this.utility];
      stateCopy.winningSequence = [...this.winningSequence];
      stateCopy.bitboards = new Map(this.bitboards);

      const pos = action.m * this.n + action.n;
      stateCopy.bitboards.set(action.playerSign, stateCopy.bitboards.get(action.playerSign) | (1n << BigInt(pos)));
      stateCopy.playerSignsRotation.shift();
      stateCopy.playerSignsRotation.push(action.playerSign);
      stateCopy.remainingMoves--;
      stateCopy.lastAction = action;

      stateCopy.checkWinner();
      return stateCopy;
  }

  checkWinner() {
      if (this._isTerminal) return true;
      if (!this.lastAction) return false;

      const playerSign = this.lastAction.playerSign;
      const bitboard = this.bitboards.get(playerSign);

      for (const { mask, positions } of this.winningMasks) {
          if ((bitboard & mask) === mask) {
              this.utility = this.playerSigns.map(s => s === playerSign ? 1 : -1);
              this._isTerminal = true;
              this.winningSequence = positions;
              return true;
          }
      }

      if (this.remainingMoves === 0) {
          this.utility.fill(0);
          this._isTerminal = true;
          return true;
      }

      return false;
  }

  isTerminal() {
      return this._isTerminal;
  }

  getUtility() {
      return this.utility;
  }

  toString() {
      return this.board.map(row => row.join(' ')).join('\n');
  }

  getCacheKey() {
    if (!this._cacheKey) {
      this._bitmask = Array.from(this.bitboards.values())
        .reduce((acc, bb) => acc | bb, 0n);
      
      this._cacheKey = `${this.remainingMoves}|` +
        `${this.playerSignsRotation.join(',')}|` +
        this._bitmask.toString(36);
    }
    return this._cacheKey;
  }

  equals(other) {
    return this.getCacheKey() === other.getCacheKey();
  }

  isMaximizerTurn() {
    return this.getCurrentPlayerSign() === this.aiPlayerSign;
  }
}