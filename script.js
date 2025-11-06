/**
 TODO

 - Improve word list
 - Force accent option
 - Archive???
 - Better random word selection?
 */

const LS_uniqueOffsets = "uniqueOffsets";

const wordsTest = ["outre", "adieu", "paris", "gérer"];

const TITLE = "Oueurdeul";

const FLIP_OFFSET = 75;
const FLIP_DELAY = 325;

class Keyboard {
  static BACKSPACE = "1";
  static ENTER = "2";

  static AZERTY = ["azertyuiop", "qsdfghjklm", "1wxcvbn2"];
  static QWERTY = ["qwertyuiop", "asdfghjkl", "1zxcvbnm2"];
}

class GameState {
  static INIT = 0;
  static RESET = 1;
  static STARTED = 2;
  static ENDED = 3;
  static PAUSED = 4;
}

class AnimationState {
  static FREE = 0;
  static BUSY = 1;
}

class App {
  words;
  currentGuess;
  guesses;
  word;
  gameState;
  animationState;

  constructor() {
    this.words = [];
    this.gameState = GameState.INIT;
    this.animationState = AnimationState.FREE;
    this.resetGameValues();
  }

  resetGameValues = () => {
    this.currentGuess = "";
    this.guesses = [];
    this.word = "";
  };

  resetGame = () => {
    this.resetGameValues();
    drawBaseLayout();

    // Alphabet
    clearAllAlphabetCellClasses();
    disableAlphabetCell(Keyboard.BACKSPACE);
    disableAlphabetCell(Keyboard.ENTER);
  };

  startGame = () => {
    this.gameState = GameState.STARTED;
    this.chooseWord();
    this.getCell(0, 0).addClass("cellCurrent");

    // TEST
    // this.test();
  };

  resetAndStartGame = () => {
    this.resetGame();
    this.startGame();
  };

  test = () => {
    this.word = "lisse";

    this.addLetter("a");
    this.addLetter("d");
    this.addLetter("i");
    this.addLetter("e");
    this.addLetter("u");
    this.submitGuess();

    this.addLetter("d");
    this.addLetter("o");
    this.addLetter("u");
    this.addLetter("e");
    this.addLetter("e");
    this.submitGuess();

    this.addLetter("p");
    this.addLetter("a");
  };

  endGame = () => {
    this.gameState = GameState.ENDED;
  };

  animate = (fn) => {
    let prevGameState = this.gameState;
    this.animationState = AnimationState.BUSY;
    fn();
    this.animationState = AnimationState.FREE;
    this.gameState = prevGameState;
  };

  isActionable = () => {
    return (
        this.gameState === GameState.STARTED &&
        this.animationState === AnimationState.FREE
    );
  };

  hasFinished = () => {
    return this.hasWon() || this.hasLost();
  };

  hasWon = () => {
    return this.guesses.at(-1) === this.word;
  };

  hasLost = () => {
    return this.guesses.length === options.nGuesses.value() && !this.hasWon();
  };

  getCurrentIndices = () => {
    let i_row = this.guesses.length;
    let i_col = this.currentGuess.length;
    return [i_row, i_col];
  };

  getPreviousCell = () => {
    let [i_row, i_col] = this.getCurrentIndices();

    if (i_col > 0) {
      return this.getCell(i_row, i_col - 1);
    } else if (i_row > 0) {
      return this.getCell(i_row - 1, nLetters - 1);
    } else {
      return this.getCurrentCell();
    }
  };

  getNextCell = () => {
    let [i_row, i_col] = this.getCurrentIndices();

    if (i_col < options.nLetters.value() - 1) {
      return this.getCell(i_row, i_col + 1);
    } else if (i_row < options.nGuesses.value() - 1) {
      return this.getCell(i_row + 1, 0);
    } else {
      return this.getCurrentCell();
    }
  };

  getCurrentCell = () => {
    let [i_row, i_col] = this.getCurrentIndices();
    return this.getCell(i_row, i_col);
  };

  getCell = (i_row, i_col) => {
    return $(`#cell-${i_row}-${i_col}`);
  };

  addLetter = (letter) => {
    if (!this.isActionable()) {
      return;
    }

    let nLetters = options.nLetters.value();

    if (this.currentGuess.length < nLetters) {
      this.getCurrentCell().text(letter.toLowerCase());
      this.getCurrentCell().removeClass("cellCurrent");
      enableAlphabetCell(Keyboard.BACKSPACE);

      if (this.currentGuess.length < nLetters - 1) {
        this.getNextCell().addClass("cellCurrent");
      } else if (this.currentGuess.length === nLetters - 1) {
        enableAlphabetCell(Keyboard.ENTER);
        $(`#abCell-${Keyboard.ENTER}`).addClass("cellCurrent");
      }

      this.currentGuess += letter;
    }
  };

  deleteLetter = () => {
    if (!this.isActionable()) {
      return;
    }

    $(`#abCell-${Keyboard.ENTER}`).removeClass("cellCurrent");

    if (this.currentGuess.length > 0) {
      this.getPreviousCell().text("");
      this.getCurrentCell().removeClass("cellCurrent");
      this.getPreviousCell().addClass("cellCurrent");

      this.currentGuess = this.currentGuess.slice(
          0,
          this.currentGuess.length - 1
      );

      disableAlphabetCell(Keyboard.ENTER);
      if (this.currentGuess.length === 0) {
        disableAlphabetCell(Keyboard.BACKSPACE);
      }
    }
  };

  submitGuess = () => {
    if (!this.isActionable()) {
      return;
    }

    // Not enough letters?
    if (this.currentGuess.length < options.nLetters.value()) {
      return;
    }

    // Invalid guess?
    if (!this.checkGuess()) {
      animateInvalidGuess();
      return;
    }

    // Valid guess
    $(`#abCell-${Keyboard.ENTER}`).removeClass("cellCurrent");

    disableAlphabetCell(Keyboard.BACKSPACE);
    disableAlphabetCell(Keyboard.ENTER);

    this.guesses.push(this.currentGuess);
    this.currentGuess = "";

    if (
        this.guesses.at(-1) === this.word ||
        this.guesses.length === options.nGuesses.value()
    ) {
      this.endGame();
    }

    this.updateGuessRow();
  };

  checkGuess = () => {
    return (
        app.words.includes(this.currentGuess) &&
        !this.guesses.includes(this.currentGuess)
    );
  };

  updateGuessRow = () => {
    let i_row = this.guesses.length - 1;
    let classes = this.getLatestGuessClasses();

    app.animationState = AnimationState.BUSY;
    app.gameState = GameState.PAUSED;

    // TODO Custom flipCells for now because of the inner function
    for (let i_col = 0; i_col < options.nLetters.value(); i_col++) {
      const cell = app.getCell(i_row, i_col);
      const letter = app.getText(i_row, i_col);
      const abCell = $(`#abCell-${letter}`);

      setTimeout(function () {
        cell.addClass("cellFlip");

        setTimeout(function () {
          cell.addClass(classes[i_col]);

          clearAlphabetCellClasses(letter);
          abCell.addClass(classes[i_col]);
        }, 0);
      }, i_col * FLIP_DELAY + FLIP_OFFSET);
    }

    setTimeout(function () {
      app.animationState = AnimationState.FREE;

      if (app.hasFinished()) {
        app.gameState = GameState.ENDED;
        showEndGameHighlight();
      } else {
        app.gameState = GameState.STARTED;
        app.getCurrentCell().addClass("cellCurrent");
      }
    }, (options.nLetters.value() + 1) * FLIP_DELAY + FLIP_OFFSET);
  };

  chooseWord = () => {
    let n, i;

    n = Math.round(Date.now() / 1000 / 60 / 60 / 24);

    // Amusing PRNG to avoid adjacent words
    n = Math.round(n ** 2 + 7 + 10 / (n * 5));
    n = Math.round(n * (n / (n * 1.5)) ** 3);
    n = n % Math.round(this.words.length / 2);
    n = Math.round(n ** 1.3);

    // Mod and index
    i = n % this.words.length;

    // Custom list?
    if (options.useCustomList.value()) {
      i += getUniqueOffsets()[options.nLetters.value()];
      i %= this.words.length;
    }

    this.word = this.words[i];
  };

  getLatestGuessClasses = () => {
    let nLetters = options.nLetters.value();
    let matchable = this.word.split("");
    let guess = this.guesses.at(-1);

    let classes = [];
    let nonrights = [];

    // First pass has to be the right ones
    for (let i = 0; i < nLetters; i++) {
      if (guess[i] === this.word[i]) {
        classes.push("cellRight");
        removeItem(matchable, guess[i]);

        // Keep track of ones not yet checked
      } else {
        classes.push("--");
        nonrights.push(i);
      }
    }

    // Only then can leftovers be given to misplaced
    for (let i of nonrights) {
      if (matchable.includes(guess[i])) {
        classes[i] = "cellMisplaced";
        removeItem(matchable, guess[i]);
      } else {
        classes[i] = "cellWrong";
      }
    }

    return classes;
  };

  getLatestGuessClassesOld = () => {
    let nLetters = options.nLetters.value();
    let matchable = this.word.split("");
    let guess = this.guesses.at(-1);

    let classes = [];
    for (let i = 0; i < nLetters; i++) {
      if (guess[i] === this.word[i]) {
        classes.push("cellRight");
        removeItem(matchable, guess[i]);
      } else if (matchable.includes(guess[i])) {
        classes.push("cellMisplaced");
        removeItem(matchable, guess[i]);
      } else {
        classes.push("cellWrong");
      }
    }

    return classes;
  };

  getText = (i_row, i_col) => {
    return this.getCell(i_row, i_col).text().toLowerCase();
  };
}

class Options {
  nLetters;
  nGuesses;
  useCustomList;

  constructor() {
    this.nLetters = null;
    this.nGuesses = null;
  }

  initialize = () => {
    this.createOptions();
    this.bindOptions();
    this.setDefaultValues();
  };

  createOptions = () => {
    this.nLetters = new OptionSpinner($("#nLetters"));
    this.nLetters.min(1);
    this.nLetters.max(7);

    this.nGuesses = new OptionSpinner($("#nGuesses"));
    this.nGuesses.min(1);
    this.nGuesses.max(9);

    this.useCustomList = new OptionCheckbox($("#useCustomList"));
  };

  bindOptions = () => {
    this.nLetters.change(() => {
      app.words = fr_1_7_alpha[options.nLetters.value()].map(deaccentWord);
      app.resetAndStartGame();
    });

    this.nGuesses.change(app.resetAndStartGame);

    this.useCustomList.change(() => {
      localStorage.setItem("useCustomList", this.useCustomList.value());
      app.resetAndStartGame();
      toggleClearCustomListButton();
    });
  };

  setDefaultValues = () => {
    // Read / use defaults
    let useCustomList = localStorage.getItem("useCustomList");
    if (useCustomList === null) {
      useCustomList = false;
    } else {
      useCustomList = this.boolify(useCustomList);
    }

    // Set defaults
    this.nLetters.value(5);
    this.nGuesses.value(6);
    this.useCustomList.value(useCustomList);

    // Trigger responses
    this.useCustomList.change();
    toggleClearCustomListButton();
    this.nLetters.change();
    this.nGuesses.change();
  };

  clearCustomlistCookies = () => {
    localStorage.removeItem("useCustomList");
    localStorage.removeItem("uniqueOffsets");
    options.useCustomList.value(false);
    toggleClearCustomListButton();
  };

  boolify = (s) => {
    if (s === "false") {
      return false;
    } else {
      return true;
    }
  };
}

const addScenes = () => {
  stage.createScene("game", "#gamePanel", "");
  stage.createScene("help", "#helpPanel", "#btnHelp");
  stage.createScene("settings", "#settingsPanel", "#btnSettings");
  stage.setDefault("game");
};

const disableAlphabetCell = (symbol) => {
  let cell = $(`#abCell-${symbol}`);
  cell.prop("disabled", true);
  cell.removeClass("abGuessed");
  cell.addClass("abGuessed");
};

const enableAlphabetCell = (symbol) => {
  let cell = $(`#abCell-${symbol}`);
  cell.prop("disabled", false);
  cell.removeClass("abGuessed");
};

const clearAlphabetCellClasses = (symbol) => {
  let abCell = $(`#abCell-${symbol}`);
  abCell.removeClass("cellRight");
  abCell.removeClass("cellMisplaced");
  abCell.removeClass("cellWrong");
};

const clearAllGuessCellClasses = () => {
  let cells = $(".cell");
  cells.removeClass("cellRight");
  cells.removeClass("cellMisplaced");
  cells.removeClass("cellWrong");
};

const clearAllAlphabetCellClasses = () => {
  let abCells = $(".abCell");
  abCells.removeClass("cellRight");
  abCells.removeClass("cellMisplaced");
  abCells.removeClass("cellWrong");
};

const deaccentWord = (word) => {
  return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const showEndGameHighlight = () => {
  if (app.gameState !== GameState.ENDED) {
    return;
  }

  // Won
  if (app.hasWon()) {
    for (let i_row = 0; i_row < options.nGuesses.value(); i_row++) {
      const row = $(`#row-${i_row}`);
      setTimeout(function () {
        row.find(".cell").addClass("cellCurrent");
      }, 50 * i_row);
    }

    // Lost
  } else {
    $(".cell").removeClass("cellCurrent");
  }

  // End game tray
  setTimeout(function () {
    drawEndGameTray();
  }, 50 * (options.nGuesses.value() + 1));
};

const animateInvalidGuess = () => {
  if (app.animationState !== AnimationState.FREE) {
    return;
  }

  app.animationState = AnimationState.BUSY;
  app.gameState = GameState.PAUSED;

  $(`#abCell-${Keyboard.ENTER}`).removeClass("cellCurrent");

  let i_row = app.guesses.length;
  let row = $(`#row-${i_row}`);

  row.addClass("rowShake");

  setTimeout(function () {
    row.removeClass("rowShake");
    $(`#abCell-${Keyboard.ENTER}`).addClass("cellCurrent");
    app.gameState = GameState.STARTED;
    app.animationState = AnimationState.FREE;
  }, 500);
};

class Format {
  static endGameTray = () => {
    let inner;
    if (app.hasWon()) {
      inner = Format.winMessage();
    } else {
      inner = Format.loseMessage();
    }

    return `<div id='winTray' class='bottomTray flexCol'>${inner}</div>`;
  };

  static winMessage = () => {
    let word = Format.winWord();

    let cells = [];
    for (let i = 0; i < word.length; i++) {
      cells.push(`<div class='cell endCell' id='winWord-${i}'></div>`);
    }

    return `<div id='winMessage' class='flexRow'>${cells.join("")}</div>`;
  };

  static winWord = () => {
    let nGuesses = options.nGuesses.value();

    if (app.guesses.length === 1) {
      return "Merveilleux !";
    } else if (app.guesses.length === nGuesses) {
      return "Fiou !";
    } else if (app.guesses.length <= nGuesses * 0.33) {
      return "Astucieux / euse !";
    } else if (app.guesses.length <= nGuesses * 0.67) {
      return "Pas mal !";
    } else {
      return "Succès !";
    }
  };

  static loseMessage = () => {
    let button = Format.revealButton();
    let word = Format.revealWord();
    return `<div id='loseMessage' class='flexCol'>${button}${word}</div>`;
  };

  static revealButton = () => {
    return `<div class='flexRow'><button id='revealWord' class='buttonBase buttonEffects'>Révéler</button></div>`;
  };

  static revealWord = () => {
    let cells = [];
    for (let i = 0; i < options.nLetters.value(); i++) {
      cells.push(`<div class='cell endCell' id='endCell-${i}'></div>`);
    }

    return `<div id='revealedWord' class='flexRow'>${cells.join("")}</div>`;
  };

  static baseLayout = () => {
    let date = Format.date();
    let rows = Format.guessRows();
    let alph = Format.alphabet();

    return `<div id="game" class="flexCol">${date}${rows}${alph}</div>`;
  };

  static date = () => {
    let dt = new Date(Date.now());
    let fmt = new Intl.DateTimeFormat("fr-CA", { dateStyle: "full" }).format(
        dt
    );

    if (options.useCustomList.value()) {
      fmt += `<div title='Selection unique pour ton appareil'>*</div>`;
    }

    return `<div class='date flexRow'>${fmt}</div>`;
  };

  static guessRows = () => {
    let rows = [];
    for (let i_row = 0; i_row < options.nGuesses.value(); i_row++) {
      rows.push(Format.guessRow(i_row));
    }

    return `<div class="rows flexCol">${rows.join("")}</div>`;
  };

  static guessRow = (i_row) => {
    let cells = [];
    for (let i_col = 0; i_col < options.nLetters.value(); i_col++) {
      cells.push(Format.guessCell(i_row, i_col));
    }

    return `<div class="row flexRow" id="row-${i_row}">${cells.join("")}</div>`;
  };

  static guessCell = (i_row, i_col) => {
    return `<div class="cell flexCol flexColCenter" id="cell-${i_row}-${i_col}"></div>`;
  };

  static alphabet = () => {
    let rows = [];
    for (let row of Keyboard.AZERTY) {
      rows.push(Format.alphabetRow(row));
    }

    return `<div id='alphabet' class='bottomTray flexCol'>${rows.join(
        ""
    )}</div>`;
  };

  static alphabetRow = (symbols) => {
    let cells = [];
    for (let symbol of symbols) {
      cells.push(Format.alphabetCell(symbol));
    }

    return `<div class='abRow flexRow'>${cells.join("")}</div>`;
  };

  static alphabetCell = (symbol) => {
    let db = "";
    let show = symbol;

    if (symbol === Keyboard.BACKSPACE) {
      db = "abDouble";
      show = '<i class="fa-solid fa-delete-left"></i>';
    } else if (symbol === Keyboard.ENTER) {
      db = "abDouble";
      show = '<i class="fa-solid fa-arrow-right"></i>';
    }

    return `<button class='abCell buttonBase buttonEffects ${db}' id='abCell-${symbol}'>${show}</button>`;
  };
}

const toggleClearCustomListButton = () => {
  let cookieUCL = localStorage.getItem("useCustomList");
  let cookieUO = localStorage.getItem("uniqueOffsets");

  $("#btnClearCustomList").prop(
      "disabled",
      (cookieUCL === null) && (cookieUO === null)
  );
};

const drawBaseLayout = () => {
  let focusPanel = $("#focusPanel");
  focusPanel.empty();
  focusPanel.append(Format.baseLayout());

  // Bind alphabet cells
  $(".abCell").click(function () {
    clickAlphabet(this.id.split("-")[1]);
  });
};

const drawEndGameTray = () => {
  $("#alphabet").addClass("dropOuttaSight");
  $("#game").append(Format.endGameTray());

  if (app.hasWon()) {
    flipCells(Format.winWord(), "#winWord", true);
  } else {
    $("#revealWord").click(revealWord);
  }
};

const flipCells = (word, selectorPrefix, fast) => {
  let delay = FLIP_DELAY;
  let offset = FLIP_OFFSET;
  let flipClass = "cellFlip";

  if (typeof fast !== "undefined" && fast) {
    delay /= 2;
    offset /= 2;
    flipClass += "Fast";
  }

  for (let i = 0; i < word.length; i++) {
    const cell = $(`${selectorPrefix}-${i}`);
    const letter = word[i];

    setTimeout(function () {
      cell.addClass(flipClass);

      setTimeout(function () {
        cell.text(letter);
      }, 0);
    }, (i + 1) * delay + offset);
  }

  setTimeout(function () {}, offset + delay * word.length);
};

const flipTitle = () => {
  flipCells(TITLE, "#titleCell", true);
};

// TODO move to app tools
const removeItem = (array, item) => {
  array.splice(array.indexOf(item), 1);
};

const revealWord = () => {
  $("#revealWord").prop("disabled", true);

  // Only time I use this at present...
  app.animate(function () {
    flipCells(app.word, "#endCell", true);
  });
};

const clickAlphabet = (symbol) => {
  if (app === null || app.gameState !== GameState.STARTED) {
    return;
  }

  if (symbol === Keyboard.BACKSPACE) {
    app.deleteLetter();
  } else if (symbol === Keyboard.ENTER) {
    app.submitGuess();
  } else {
    app.addLetter(symbol);
  }
};

const getUniqueOffsets = () => {
  // TODO possibly make PRNG instead of true RNG
  // So that the same machine always gets the same offsets, even if they clear cache?
  // Not sure if desirable or not

  if (localStorage.getItem(LS_uniqueOffsets) === null) {
    let uo = {};
    for (let len = 1; len < 8; len++) {
      uo[len] = Tools.random(fr_1_7_alpha[len].length - 1);
    }
    localStorage.setItem(LS_uniqueOffsets, JSON.stringify(uo));
  }

  return JSON.parse(localStorage.getItem(LS_uniqueOffsets));
};

const handleKeyup = (e) => {
  // Allow ctrl through for scrolling
  if (e.keyCode !== 17) {
    e.preventDefault();
  }

  let letter;
  if (e.keyCode >= 65 && e.keyCode <= 90) {
    letter = String.fromCharCode(e.keyCode).toLowerCase();
    $(`#abCell-${letter}`).click();
  } else if (e.keyCode === 13) {
    $(`#abCell-${Keyboard.ENTER}`).click();
  } else if (e.keyCode === 8) {
    $(`#abCell-${Keyboard.BACKSPACE}`).click();
  }
};

const handleKeydown = (e) => {
  // Allow ctrl through for scrolling
  if (e.keyCode !== 17) {
    e.preventDefault();
  }
  return false;
}

const bind = () => {
  $(document).keyup(handleKeyup);
  $(document).keydown(handleKeydown);

  $("#btnReset").click(() => {
    app.resetGame();
    app.startGame();
  });

  $("#btnClearCustomList").click(() => {
    options.clearCustomlistCookies();
  });
};

const initialize = () => {
  stage = new Stage();
  addScenes();
  stage.show("game");

  // Test
  // stage.show("settings");

  app = new App();
  options = new Options();
  options.initialize();

  bind();
  flipTitle();

  app.resetGame();
  app.startGame();

  // test
  // drawEndGameTray();
};

let stage = null;
let app = null;
let options = null;

$(document).ready(initialize);
