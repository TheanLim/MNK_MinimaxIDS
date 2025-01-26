// utility.js

function transpose2DList(lst) {
  const transposedList = lst[0].map((_, colIndex) => lst.map(row => row[colIndex]));
  return transposedList;
}

function getMaxIndex(list) {
if (!list.length) return -1;

const max = Math.max(...list);
const maxIndex = list.indexOf(max);

return list.every(val => val === max) ? -1 : maxIndex;
}

function showLoadingPopup() {
const loaderContainer = document.createElement('div');
loaderContainer.classList.add('loader-container');
loaderContainer.innerHTML = '<span class="loader"></span>';
document.body.appendChild(loaderContainer);
}

function hideLoadingPopup() {
const loaderContainer = document.querySelector(".loader-container");
if (loaderContainer) {
  loaderContainer.remove();
}
}

function showMessage(message, duration) {
const messageElement = document.createElement("div");
messageElement.classList.add("message");
messageElement.textContent = message;
document.body.appendChild(messageElement);
messageElement.style.display = "block";
setTimeout(() => {
    messageElement.style.display = "none";
    document.body.removeChild(messageElement);
}, duration);
}

function utilityMNK(state, depth) {
  let utility = 0;
  let weightPerSign = 1 / state.k;
  let board = state.board; // Changed from getBoard() to .board property

  const calculateUtility = (lst) => {
    const LARGE_WIN_UTILITY = 1000000000;
    let utility = 0;
    let consecEmptyCells = 0;
    let emptyCellsReqToWin = state.k;
    let candidateWinningPos = [];
    let prevSign = null;
    for (let idx = 0; idx < lst.length; idx++) {
      let sign = lst[idx];
      if (sign === state.emptySign) {
        consecEmptyCells += 1;
        emptyCellsReqToWin -= 1;
      } else {
        if (sign !== prevSign) {
          candidateWinningPos = [];
        }
        prevSign = sign;
        emptyCellsReqToWin = candidateWinningPos.length === 0 ? state.k - consecEmptyCells - 1 : emptyCellsReqToWin - 1;
        consecEmptyCells = 0;
        candidateWinningPos.push(idx + state.k - 1);
        if (emptyCellsReqToWin <= 0) {
          let direction = prevSign === state.getCurrentPlayerSign() ? 1 : -1;
          utility += direction * weightPerSign * candidateWinningPos.length;
          if (candidateWinningPos.length === state.k) {
            return direction * LARGE_WIN_UTILITY;
          }
          if (candidateWinningPos.length + 1 === state.k) {
            let bonus = prevSign === state.getCurrentPlayerSign() ? 1 * state.k : -2 * state.k;
            utility += bonus;
          }
        }
        if (candidateWinningPos.length > 0 && candidateWinningPos[0] === idx) {
          candidateWinningPos.shift();
        }
      }
    }
    return utility;
  };

  for (let row of board) {
    if (row.some(sign => state.playerSigns.includes(sign))) {
      utility += calculateUtility(row);
    }
  }

  let boardTranspose = transpose2DList(board);
  for (let col of boardTranspose) {
    if (col.some(sign => state.playerSigns.includes(sign))) {
      utility += calculateUtility(col);
    }
  }

  let startRow, endRow, startCol, endCol;
  let startPos;
  startRow = 0;
  endRow = state.m - state.k;
  startCol = 0;
  endCol = state.n - state.k;
  startPos = [...Array(endRow - startRow + 1).keys()].map(i => [i, 0])
    .concat([...Array(endCol - startCol + 1).keys()].map(i => i !== 0 ? [0, i] : null).filter(x => x !== null));
  for (let [startI, startJ] of startPos) {
    let diagList = [];
    while (startI < state.m && startJ < state.n) {
      diagList.push(board[startI][startJ]);
      startI += 1;
      startJ += 1;
    }
    utility += calculateUtility(diagList);
  }

  startRow = 0;
  endRow = state.m - state.k;
  startCol = state.k - 1;
  endCol = state.n - 1;
  startPos = [...Array(endRow - startRow + 1).keys()].map(i => [i, state.n - 1])
    .concat([...Array(endCol - startCol + 1).keys()].map(i => i !== state.n - 1 ? [0, i] : null).filter(x => x !== null));
  for (let [startI, startJ] of startPos) {
    let diagList = [];
    while (startI < state.m && startJ >= 0) {
      diagList.push(board[startI][startJ]);
      startI += 1;
      startJ -= 1;
    }
    utility += calculateUtility(diagList);
  }

  return depth % 2 === 1 ? -utility : utility;
}