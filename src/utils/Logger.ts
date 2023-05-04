import chalk from "chalk";
import moment from "moment";
import { Logger as WinstonLogger, createLogger, format, transports } from "winston";

export default class Logger {
    private _log: WinstonLogger;

    constructor() {
        this._log = createLogger({
            level: "info",
            format: format.combine(
                format.timestamp(),
                format.printf(
                    (log) => `${moment(log.timestamp).format("DD/MM/YYYY, hh:mm:ss")} ${chalk.black.bgGreen(`[${log.label}]`)} ${this._getColored(log.level)}: ${log.message}`
                )
            ),
            transports: [new transports.Console()]
        });
    }

    ready(message: string): void {
        this._log.info(message, { label: "READY" });
    }

    info(label: string, message: string): void {
        this._log.info(message, { label });
    }

    warn(label: string, message: string): void {
        this._log.warn(message, { label });
    }

    error(label: string, error: Error | string): void {
        if (typeof error === "string") {
            this._log.error(error, { label });
        } else {
            this._log.error(error.stack ? error.stack : error.toString(), { label });
        }
    }

    private _getColored(logLevel: string): string {
        if (logLevel === "error") {
            return chalk.red.bold(logLevel);
        } else if (logLevel === "warn") {
            return chalk.yellow.bold(logLevel);
        } else if (logLevel === "info") {
            return chalk.blue.bold(logLevel);
        }

        return chalk.white(logLevel);
    }
}
