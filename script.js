document.addEventListener("DOMContentLoaded", function() {
    // Get references to start button and options button
    let startButton = document.getElementById('start-game-button');
    const optionsButton = document.getElementById('options-button');
    
    // Add event listeners for buttons and input fields
    startButton.addEventListener('click', startOrRestartGame);
    optionsButton.addEventListener('click', toggleOptions);
    document.getElementById("m").addEventListener("change", startOrRestartGame);
    document.getElementById("n").addEventListener("change", startOrRestartGame);
    document.getElementById("k").addEventListener("change", startOrRestartGame);
    document.getElementById("players").addEventListener("change", startOrRestartGame);
    document.querySelectorAll('input[name="startingPlayer"]').forEach(radio => {
        radio.addEventListener('change', startOrRestartGame);
    });
    
    // Function to toggle advanced options dropdown
    function toggleOptions() {
        const dropdown = document.querySelector('.dropdown');
        dropdown.classList.toggle('active');
    }
    
    // Function to start or restart the game
    async function startOrRestartGame() {
        // Clear cell content (if any)
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.textContent = '-';
            cell.classList.remove("winning-cell");
        });

        // Show info when the game starts
        document.getElementById("game-info").style.display = "block";
        // Reset "Current Player" and "Results" elements
        document.getElementById("current-player").textContent = "";
        document.getElementById("results").textContent = "";

        // Update button text and style
        startButton.textContent = 'Restart Game';
        startButton.style.backgroundColor = '#ccc';

        // Parse input fields
        const M = parseInt(document.getElementById("m").value);
        const N = parseInt(document.getElementById("n").value);
        const K = parseInt(document.getElementById("k").value);
        const playersInput = document.getElementById("players").value.split(',');
        const PLAYERS = playersInput.length === 2 ? playersInput : ['X', 'O'];
        const startingPlayer = document.querySelector('input[name="startingPlayer"]:checked').value;
        const searchTime = 5000;
        const searchDepth = parseInt(document.getElementById("search-depth").value);

        let game;
        try {
            game = new MNK(M, N, K, PLAYERS);
        } catch (error) {
            showMessage(`Error: ${error.message}`, 5000);
            return;
        }
        let agent = new MinimaxIDS(searchTime, searchDepth, utilityMNK, cacheExpansion, true, true);

        renderBoard();
        if (startingPlayer === 'ai') {
            showLoadingPopup(); // Show loading pop-up before agent search
            setTimeout(async () => { // Use setTimeout to allow the UI to update
                const agentAction = await agent.search(game);
                game = game.takeAction(agentAction);
                hideLoadingPopup();
                renderBoard();
                checkGameTerminal();
            }, 0);
        }

        // Function to render the game board
        function renderBoard() {
          let gameBoard = document.getElementById("game-board");
          gameBoard.innerHTML = "";
          for (let j = 0; j < game.n; j++) {
            let col = document.createElement("div");
            for (let i = 0; i < game.m; i++) {
              let cell = document.createElement("div");
              cell.classList.add("cell");
              cell.textContent = game.board[i][j];
              cell.addEventListener("click", () => handleCellClick(i, j));
              
              // Highlight winning cells
              if (game.winningSequence && game.winningSequence.includes(`${i},${j}`)) {
                cell.classList.add("winning-cell");
              } 
              // Highlight the last move if no winner
              else if (
                !game.isTerminal() &&
                game.lastAction &&
                game.lastAction.m === i &&
                game.lastAction.n === j
              ) {
                cell.classList.add("last-move");
              }
              col.appendChild(cell);
            }
            gameBoard.appendChild(col);
          }
          document.getElementById("current-player").textContent = game.getCurrentPlayerSign();
        }

        // Function to check if the game has ended
        function checkGameTerminal(){
            if (game.isTerminal()) {
                let scores = game.getUtility();
                let maxIdx = getMaxIndex(scores)
                document.getElementById("results").textContent = maxIdx === -1 ? "Tie!" : `${PLAYERS[maxIdx]} win!`;
                showMessage(maxIdx === -1 ? "Tie!" : `${PLAYERS[maxIdx]} win!`, 3000);
                renderBoard();
                return true;
            }
            return false;
        }

        // Function to handle cell click event
        async function handleCellClick(row, col) {
            if (game.board[row][col] !== game.emptySign) {
                showMessage("Please click on empty spots.", 2000);
                return;
            }

            if (game.isTerminal()) {
                renderBoard();
                showMessage("Game Ended.", 2000);
                return;
            }

            const action = new MNKAction(game.getCurrentPlayerSign(), row, col);
            game = game.takeAction(action);
            renderBoard();

            if (checkGameTerminal()) {
                return;
            }

            showLoadingPopup(); // Show loading pop-up before agent search
            setTimeout(async () => { // Use setTimeout to allow the UI to update
                const agentAction = await agent.search(game);
                game = game.takeAction(agentAction);
                hideLoadingPopup();
                renderBoard();
                checkGameTerminal();
            }, 0);
        }
    }
});
