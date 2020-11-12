import {Game} from './game.js';
import {Rack} from './rack.js';
import * as utils from "./scrabbleUtils.js";

const NUMBER_OF_PLAYERS = 2;
let turn = 0; // Player 1 starts the game

//homework 9
async function addWordScore(name, word, score) {
  const response = await fetch("http://localhost:8080/wordScore", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify({name: name, word: word, score: score})
  });
  if (!response.ok) {
    console.log(response.error);
    return;
  }
}

async function addGameScore(name, score) {
  const response = await fetch("http://localhost:8080/gameScore", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify({name: name, score: score})
  });
  if (!response.ok) {
    console.log(response.error);
    return;
  }
}

function updateTurn() {
    document.getElementById("turn").innerText = document.getElementById(`p${turn % NUMBER_OF_PLAYERS}-name`).value;
}

function renderGame(game) {
    game.render(document.getElementById('board'));
}

function renderRacks(racks) {
    racks.forEach((rack, i) => rack.render(document.getElementById(`p${i}-rack`)));
}

window.addEventListener("load", async function() {
    const response = await fetch("dictionary.json");
    if (!response.ok) {
        console.log(response.error);
        return;
    }

    // We make dictionary a global.
    window.dictionary = await response.json();

    const game = new Game();

    updateTurn();

    const racks = [];
    const scores = Array.from(Array(NUMBER_OF_PLAYERS), () => 0);
    for (let i = 0; i < NUMBER_OF_PLAYERS; ++i) {
        racks[i] = new Rack();

        racks[i].takeFromBag(7, game);

        document.getElementById(`p${i}-name`).addEventListener("change", updateTurn);
    }

    renderRacks(racks);
    renderGame(game);

    //get wordscores
    const responseWS = await fetch("http://localhost:8080/highestWordScores");
    const wordScoreJSON = await responseWS.json();
    if (!responseWS.ok) {
      console.log(responseWS.error);
      return;
    }else {
      //display wordscore table
      document.getElementById("wordscores").appendChild(document.createTextNode("Highest Word Scores:"));
      for (let i=0; i<wordScoreJSON.length; i++) {
        let child = document.createElement("LI");
        let content = wordScoreJSON[i].name + " played the word " + wordScoreJSON[i].word + " for a score of " + wordScoreJSON[i].score;
        child.appendChild(document.createTextNode(content));
        document.getElementById("wordscores").appendChild(child);
      }
    }

    //get gameScores
    const responseGS = await fetch("http://localhost:8080/highestGameScores");
    const gameScoreJSON = await responseGS.json();
    if (!responseGS.ok) {
      console.log(responseGS.error);
      return;
    }else {
      //display gameScore table
      document.getElementById("gamescores").appendChild(document.createTextNode("Highest Game Scores:"));
      for (let i=0; i<gameScoreJSON.length; i++) {
        let child = document.createElement("LI");
        let content = gameScoreJSON[i].name + " finished with a score of " + gameScoreJSON[i].score;
        child.appendChild(document.createTextNode(content));
        document.getElementById("gamescores").appendChild(child);
      }
    }

    document.getElementById('play').addEventListener('click', () => {
        const word = document.getElementById('word').value;
        const x = parseInt(document.getElementById('x').value);
        const y = parseInt(document.getElementById('y').value);
        const direction = document.getElementById('direction').value === 'horizontal';

        const rack = racks[turn % NUMBER_OF_PLAYERS];

        // We need to remove tiles already on the grid from the word trying to be constructed.
        let remaining = word;
        for (let i = 0; i < word.length; ++i) {
            const tile = direction ? game.getGrid()[x + i][y] : game.getGrid()[x][y + i];
            if (tile !== null) {
                if (tile !== word[i]) {
                    alert(`The word intercepts already placed tiles.`);
                    return;
                } else {
                    remaining = remaining.replace(tile, '');
                }
            }
        }

        if (!utils.canConstructWord(rack.getAvailableTiles(), remaining)) {
            alert(`The word ${word} cannot be constructed.`);
        } else {
            try {
                scores[turn % NUMBER_OF_PLAYERS] += game.playAt(word, {x, y}, direction);
                document.getElementById('word').value = "";
                document.getElementById(`p${turn % NUMBER_OF_PLAYERS}-score`).innerText = scores[turn % NUMBER_OF_PLAYERS];
                renderGame(game);

                //homework 9
                const name = document.getElementById(`p${turn % NUMBER_OF_PLAYERS}-name`).value
                addWordScore(name, word, scores[turn % NUMBER_OF_PLAYERS]);

                const used = utils.constructWord(rack.getAvailableTiles(), remaining);
                used.forEach(tile => rack.removeTile(tile));
                rack.takeFromBag(used.length, game);
                renderRacks(racks);
                ++turn;
                updateTurn();
            } catch (e) {
                alert(e);
            }
        }
    });

    //homework 9
    document.getElementById('end').addEventListener('click', async function() {

      //save game scores
      for (let i=0; i<NUMBER_OF_PLAYERS; ++i) {
        addGameScore(document.getElementById(`p${i}-name`).value, scores[i]);
      }

    });

    document.getElementById('reset').addEventListener('click', () => {
        game.reset();
        renderGame(game);
    });

    document.getElementById('shuffle').addEventListener('click', () => {
        racks[turn % NUMBER_OF_PLAYERS].shuffle(game);
        renderRacks(racks);
    });
});
