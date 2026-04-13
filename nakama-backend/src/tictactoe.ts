var OPCODE_MOVE = 1;
var OPCODE_GAME_STATE = 2;
var OPCODE_GAME_OVER = 3;
var OPCODE_START = 4;

var WIN_CONDITIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function checkWinner(board) {
  for (var i = 0; i < WIN_CONDITIONS.length; i++) {
    var a = WIN_CONDITIONS[i][0];
    var b = WIN_CONDITIONS[i][1];
    var c = WIN_CONDITIONS[i][2];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  var full = true;
  for (var j = 0; j < board.length; j++) {
    if (board[j] === "") { full = false; break; }
  }
  return full ? "draw" : null;
}

function matchInit(ctx, logger, nk, params) {
  logger.info("Match initialized");
  var state = {
    board: ["", "", "", "", "", "", "", "", ""],
    currentTurn: "",
    players: {},
    playerOrder: [],
    gameOver: false,
    winner: null,
    started: false
  };
  return { state: state, tickRate: 1, label: "tictactoe" };
}

function matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
  logger.info("Player attempting to join: " + presence.username);
  if (state.playerOrder.length >= 2) {
    return { state: state, accept: false, rejectReason: "Match is full" };
  }
  return { state: state, accept: true };
}

function matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {
  for (var i = 0; i < presences.length; i++) {
    var presence = presences[i];
    if (state.playerOrder.length >= 2) continue;
    var symbol = state.playerOrder.length === 0 ? "X" : "O";
    state.players[presence.userId] = { symbol: symbol, displayName: presence.username };
    state.playerOrder.push(presence.userId);
    logger.info("Player joined: " + presence.username + " as " + symbol);
  }
  return { state: state };
}

function matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {
  for (var i = 0; i < presences.length; i++) {
    var presence = presences[i];
    logger.info("Player left: " + presence.username);
    if (!state.gameOver && state.playerOrder.length === 2) {
      state.gameOver = true;
      var winnerId = null;
      for (var j = 0; j < state.playerOrder.length; j++) {
        if (state.playerOrder[j] !== presence.userId) {
          winnerId = state.playerOrder[j];
          break;
        }
      }
      state.winner = winnerId;
      var msg = JSON.stringify({
        winner: state.winner,
        winnerSymbol: winnerId ? state.players[winnerId].symbol : null,
        reason: "opponent_disconnected",
        board: state.board,
        players: state.players
      });
      dispatcher.broadcastMessage(OPCODE_GAME_OVER, msg, null, null, true);
    }
  }
  return { state: state };
}

function matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {
  if (state.gameOver) return null;

  if (state.playerOrder.length === 2 && !state.started) {
    state.started = true;
    state.currentTurn = state.playerOrder[0];
    var msg = JSON.stringify({
      board: state.board,
      currentTurn: state.currentTurn,
      players: state.players,
      message: "Game started! X goes first."
    });
    dispatcher.broadcastMessage(OPCODE_START, msg, null, null, true);
    logger.info("Game started! Broadcast sent to clients.");
  }

  for (var i = 0; i < messages.length; i++) {
    var message = messages[i];
    var userId = message.sender.userId;
    if (message.opCode !== OPCODE_MOVE) continue;

    var moveData;
    try {
      moveData = JSON.parse(nk.binaryToString(message.data));
    } catch (e) {
      logger.error("Invalid move data");
      continue;
    }

    var position = moveData.position;

    if (state.currentTurn !== userId) {
      logger.warn("Not this player's turn");
      continue;
    }
    if (position < 0 || position > 8) {
      logger.warn("Invalid position");
      continue;
    }
    if (state.board[position] !== "") {
      logger.warn("Cell already occupied");
      continue;
    }

    var symbol = state.players[userId].symbol;
    state.board[position] = symbol;

    var result = checkWinner(state.board);
    if (result) {
      state.gameOver = true;
      var winnerId = null;
      if (result !== "draw") {
        for (var j = 0; j < state.playerOrder.length; j++) {
          if (state.players[state.playerOrder[j]].symbol === result) {
            winnerId = state.playerOrder[j];
            break;
          }
        }
      }
      state.winner = winnerId || (result === "draw" ? "draw" : null);
      var gameOverMsg = JSON.stringify({
        winner: state.winner,
        winnerSymbol: result !== "draw" ? result : null,
        isDraw: result === "draw",
        reason: "game_complete",
        board: state.board,
        players: state.players
      });
      dispatcher.broadcastMessage(OPCODE_GAME_OVER, gameOverMsg, null, null, true);
      logger.info("Game over! Result: " + result);
    } else {
      for (var k = 0; k < state.playerOrder.length; k++) {
        if (state.playerOrder[k] !== userId) {
          state.currentTurn = state.playerOrder[k];
          break;
        }
      }
      var stateMsg = JSON.stringify({
        board: state.board,
        currentTurn: state.currentTurn,
        players: state.players,
        lastMove: { userId: userId, position: position, symbol: symbol }
      });
      dispatcher.broadcastMessage(OPCODE_GAME_STATE, stateMsg, null, null, true);
    }
  }
  return { state: state };
}

function matchSignal(ctx, logger, nk, dispatcher, tick, state) {
  return { state: state };
}

function matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
  logger.info("Match terminated");
  return { state: state };
}

function matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
  logger.info("Player attempting to join: " + presence.username);
  if (state.playerOrder.length >= 2) {
    return { state: state, accept: false, rejectReason: "Match is full" };
  }
  return { state: state, accept: true };
}

function rpcCreateMatch(ctx, logger, nk, payload) {
  var matchId = nk.matchCreate("tictactoe", {});
  logger.info("Created match: " + matchId);
  return JSON.stringify({ matchId: matchId });
}

function rpcFindMatch(ctx, logger, nk, payload) {
  var matches = nk.matchList(10, true, "tictactoe", 1, 1, "");
  if (matches.length > 0) {
    return JSON.stringify({ matchId: matches[0].matchId });
  }
  var matchId = nk.matchCreate("tictactoe", {});
  return JSON.stringify({ matchId: matchId });
}

function matchmakerMatched(ctx, logger, nk, matches) {
  logger.info("Matchmaker matched users, creating authoritative match...");
  try {
    var matchId = nk.matchCreate("tictactoe", {});
    logger.info("Created authoritative match: " + matchId);
    return matchId;
  } catch (e) {
    logger.error("Error creating match: " + e.message);
    throw e;
  }
}

function InitModule(ctx, logger, nk, initializer) {
  initializer.registerMatch("tictactoe", {
    matchInit: matchInit,
    matchJoinAttempt: matchJoinAttempt,
    matchJoin: matchJoin,
    matchLeave: matchLeave,
    matchLoop: matchLoop,
    matchSignal: matchSignal,
    matchTerminate: matchTerminate
  });

  initializer.registerRpc("create_match", rpcCreateMatch);
  initializer.registerRpc("find_match", rpcFindMatch);
  initializer.registerMatchmakerMatched(matchmakerMatched);

  try {
    nk.leaderboardCreate("tictactoe_wins", false, "desc", "increment", null, {});
    logger.info("Leaderboard tictactoe_wins created successfully.");
  } catch (err) {
    logger.error("Failed to create leaderboard: " + err.message);
  }

  logger.info("=== Tic-Tac-Toe module loaded successfully ===");
}
