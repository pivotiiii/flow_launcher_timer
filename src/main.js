import {execFileSync} from "child_process";
import path from "path";
import {fileURLToPath} from "url";

import open from "../node_modules/open/index.js";

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../");
const hourglassPath = path.resolve(__dirname, "hourglass", "Hourglass.exe");

const {method, parameters, settings} = JSON.parse(process.argv[2]);

if (method === "query") {
    const query = parameters[0];
    if (query.length > 0) {
        parseQuery(query, settings);
    } else {
        console.log(JSON.stringify({result: []}));
    }
} else if (method === "startTimer") {
    open(hourglassPath, {app: {arguments: parameters}});
} else if (method === "showHelp") {
    open(path.resolve(__dirname, "help", "help.html"));
}

function parseQuery(query, settings) {
    try {
        const splitQuery = query.split(" ");
        let title = null;

        const stdOut = execFileSync(hourglassPath, ["--validate-args", "on", query]).toString();
        const isValidArgs = stdOut.split(/\r?\n/)[0] === "true";
        let timeString = isValidArgs ? stdOut.split(/\r?\n/)[2] : null;
        if (isValidArgs === false) {
            if (splitQuery.length > 1) {
                const titleFirst = splitQuery.slice(0, 1)[0];
                const argsRemainingTitleFirst = splitQuery.slice(1, splitQuery.length);
                const titleLast = splitQuery.slice(splitQuery.length - 1, splitQuery.length)[0];
                const argsRemainingTitleLast = splitQuery.slice(0, splitQuery.length - 1);

                const stdOutTitleFirst = execFileSync(hourglassPath, ["--validate-args", "on", "--title", titleFirst, argsRemainingTitleFirst.join(" ")]).toString();
                const stdOutTitleLast = execFileSync(hourglassPath, ["--validate-args", "on", "--title", titleLast, argsRemainingTitleLast.join(" ")]).toString();

                if (stdOutTitleFirst.split(/\r?\n/)[0] === "true") {
                    title = titleFirst;
                    query = argsRemainingTitleFirst.join(" ");
                    timeString = stdOutTitleFirst.split(/\r?\n/)[2];
                } else if (stdOutTitleLast.split(/\r?\n/)[0] === "true") {
                    title = titleLast;
                    query = argsRemainingTitleLast.join(" ");
                    timeString = stdOutTitleLast.split(/\r?\n/)[2];
                } else {
                    logInvalidQuery();
                }
            } else {
                logInvalidQuery();
            }
        }

        if (isValidArgs === true || title != null) {
            const optionsArray = ["--use-factory-defaults", "--loop-sound", "on", "--window-title", "title+left"];

            if (title != null) {
                optionsArray.push("--title");
                optionsArray.push(title);
            }

            optionsArray.push("--theme");
            optionsArray.push(`${settings.theme}${settings.useDarkTheme === "true" ? "-dark" : ""}`);
            optionsArray.push("--prefer-24h-time");
            optionsArray.push(`${settings.prefer24h === "true" ? "on" : "off"}`);
            optionsArray.push("--digital-clock-time");
            optionsArray.push(`${settings.displayDigital === "true" ? "on" : "off"}`);
            optionsArray.push("--show-time-elapsed");
            optionsArray.push(`${settings.elapsedTime === "true" ? "on" : "off"}`);

            optionsArray.push(query);

            logValidQuery(timeString, optionsArray, title);
        }
    } catch (error) {
        logHourglassError(error);
    }
}

function logValidQuery(timeString, optionsArray, title) {
    const description =
        (timeString != null ? timeString : "") + //time
        (timeString != null && title != null ? " - " : "") + //dash if both
        (title != null ? `Title: ${title}` : ""); //only title
    console.log(
        JSON.stringify({
            result: [
                {
                    Title: "Start timer",
                    Subtitle: description,
                    JsonRPCAction: {
                        method: "startTimer",
                        parameters: optionsArray,
                    },
                    IcoPath: path.resolve(__dirname, "img", "app.png"),
                    score: 100,
                },
                {
                    Title: "Start timer (always on top)",
                    Subtitle: description,
                    JsonRPCAction: {
                        method: "startTimer",
                        parameters: ["--always-on-top", "on", ...optionsArray],
                    },
                    IcoPath: path.resolve(__dirname, "img", "app.png"),
                    score: 0,
                },
                {
                    Title: "Start timer (minimized)",
                    Subtitle: description,
                    JsonRPCAction: {
                        method: "startTimer",
                        parameters: ["--window-state", "minimized", ...optionsArray],
                    },
                    IcoPath: path.resolve(__dirname, "img", "app.png"),
                    score: -100,
                },
            ],
        })
    );
}

function logInvalidQuery() {
    console.log(
        JSON.stringify({
            result: [
                {
                    Title: "Show help",
                    Subtitle: "Invalid time input",
                    JsonRPCAction: {
                        method: "showHelp",
                        parameters: [],
                    },
                    IcoPath: path.resolve(__dirname, "img", "help.png"),
                    score: 0,
                },
            ],
        })
    );
}

function logHourglassError(error) {
    console.log(
        JSON.stringify({
            result: [
                {
                    Title: "Error running dependency Hourglass.exe",
                    Subtitle: `Please try reinstalling the plugin. (${error.message})`,
                    JsonRPCAction: {
                        method: "",
                        parameters: [],
                    },
                    IcoPath: path.resolve(__dirname, "img", "err.png"),
                    score: 0,
                },
            ],
        })
    );
}
