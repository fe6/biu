"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatError = void 0;
const compiler_sfc_1 = require("vue/compiler-sfc");
const { logger } = require("@fe6/biu-utils");

function formatError(err, source, file) {
    const loc = err.loc;
    if (!loc) {
        return;
    }
    const locString = `:${loc.start.line}:${loc.start.column}`;
    const codeframe = (0, compiler_sfc_1.generateCodeFrame)(source, loc.start.offset, loc.end.offset);
    logger.empty();
    logger.errorOnly(`VueCompilerError: ${err.message}`);
    logger.infoOnly(`at ${file}${locString}`);
    logger.errorExit(codeframe);
}

exports.formatError = formatError;
