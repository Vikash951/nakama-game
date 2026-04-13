function matchmakerMatched(ctx, logger, nk, matches) {
    logger.error("SUPER TEST LOG HOOK");
    return nk.matchCreate("tictactoe", {});
}
function InitModule(ctx, logger, nk, initializer) {
    initializer.registerMatchmakerMatched(matchmakerMatched);
    logger.info("Test module loaded");
}
