import {execFileSync} from "child_process";
import path from "path";
import {fileURLToPath} from "url";

import open from "../node_modules/open/index.js";
//import {error} from "console";

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../");
const hourglassDir = path.resolve(__dirname, "hourglass");
const hourglassExe = path.resolve(hourglassDir, "Hourglass.exe");
const hourglassValidatorExe = path.resolve(hourglassDir, "hourglass_args_validator.exe");
const pathIconApp = path.resolve(__dirname, "img", "app.png");
const pathIconError = path.resolve(__dirname, "img", "err.png");
const pathIconHelp = path.resolve(__dirname, "img", "help.png");

const hourglassCommands = {resume: ["resume", "continue", "go"], pause: ["pause", "wait", "stop"]};

const {method, parameters, settings} = JSON.parse(process.argv[2]);

if (method === "query") {
    // if (parameters[0].split(" ")[0] === "debug") error(process.argv[2]); //for  debugging
    const query = parameters[0];
    if (query.length > 0) {
        parseQuery(query, settings);
    } else {
        logEmptyQuery();
        //console.log(JSON.stringify({result: []}));
    }
} else if (method === "startTimer") {
    //error([process.argv[2], parameters]); //for debugging
    open(hourglassExe, {app: {arguments: parameters}});
} else if (method === "showHelp") {
    open(path.resolve(__dirname, "help", "help.html"));
}

function parseQuery(query, settings) {
    try {
        for (const [key, value] of Object.entries(hourglassCommands)) {
            if (value.includes(query)) {
                logCommand(key);
                return;
            }
        }

        const splitQuery = query.split(" ");
        let title = null;

        const result = hourglassValidateArgs([query]);

        const isValidArgs = result.result;
        let timeString = result.timeStrings.length > 0 ? result.timeStrings[0] : null;

        if (!isValidArgs) {
            if (splitQuery.length > 1) {
                const titleFirst = splitQuery.slice(0, 1)[0];
                const argsRemainingTitleFirst = splitQuery.slice(1, splitQuery.length);
                const titleLast = splitQuery.slice(splitQuery.length - 1, splitQuery.length)[0];
                const argsRemainingTitleLast = splitQuery.slice(0, splitQuery.length - 1);

                const resultFirst = hourglassValidateArgs(["--title", titleFirst, argsRemainingTitleFirst.join(" ")]);
                const resultLast = hourglassValidateArgs(["--title", titleLast, argsRemainingTitleLast.join(" ")]);

                if (resultFirst.result) {
                    title = titleFirst;
                    query = argsRemainingTitleFirst.join(" ");
                    timeString = resultFirst.timeStrings.length > 0 ? resultFirst.timeStrings[0] : null;
                } else if (resultLast.result) {
                    title = titleLast;
                    query = argsRemainingTitleLast.join(" ");
                    timeString = resultLast.timeStrings.length > 0 ? resultLast.timeStrings[0] : null;
                } else {
                    logInvalidQuery();
                    return;
                }
            } else {
                logInvalidQuery();
                return;
            }
        }

        if (isValidArgs === true || title != null) {
            const optionsArray = ["--loop-sound", "on", "--window-title", "title"];

            if (title != null) {
                optionsArray.push("--title");
                optionsArray.push(title);
            }

            optionsArray.push("--theme");
            optionsArray.push(`${settings.theme}${settings.useDarkTheme === true ? "-dark" : ""}`);
            optionsArray.push("--prefer-24h-time");
            optionsArray.push(`${settings.prefer24h === true ? "on" : "off"}`);
            optionsArray.push("--digital-clock-time");
            optionsArray.push(`${settings.displayDigital === true ? "on" : "off"}`);
            optionsArray.push("--show-time-elapsed");
            optionsArray.push(`${settings.elapsedTime === true ? "on" : "off"}`);

            optionsArray.push(query);

            logValidQuery(timeString, optionsArray, title);
        }
    } catch (error) {
        logHourglassError(error);
        return;
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
                    IcoPath: pathIconApp,
                    score: 100,
                },
                {
                    Title: "Start timer (always on top)",
                    Subtitle: description,
                    JsonRPCAction: {
                        method: "startTimer",
                        parameters: ["--always-on-top", "on", ...optionsArray],
                    },
                    IcoPath: pathIconApp,
                    score: 0,
                },
                {
                    Title: "Start timer (minimized)",
                    Subtitle: description,
                    JsonRPCAction: {
                        method: "startTimer",
                        parameters: ["--window-state", "minimized", ...optionsArray],
                    },
                    IcoPath: pathIconApp,
                    score: -100,
                },
            ],
        })
    );
}

function logCommand(command) {
    let description = null;
    switch (command) {
        case "continue":
        case "resume":
        case "go":
            description = "Resume all paused timers.";
            break;
        case "wait":
        case "stop":
        case "pause":
            description = "Pause all running timers.";
            break;
        default:
            console.log(JSON.stringify({result: []}));
            return;
    }
    console.log(
        JSON.stringify({
            result: [
                {
                    Title: description,
                    Subtitle: "",
                    JsonRPCAction: {
                        method: "startTimer",
                        parameters: [command],
                    },
                    IcoPath: pathIconApp,
                    score: 0,
                },
            ],
        })
    );
}

function logEmptyQuery() {
    console.log(
        JSON.stringify({
            result: [
                {
                    Title: "Pause all running timers.",
                    Subtitle: "",
                    JsonRPCAction: {
                        method: "startTimer",
                        parameters: ["pause"],
                    },
                    IcoPath: pathIconApp,
                    score: 0,
                },
                {
                    Title: "Resume all running timers.",
                    Subtitle: "",
                    JsonRPCAction: {
                        method: "startTimer",
                        parameters: ["resume"],
                    },
                    IcoPath: pathIconApp,
                    score: 0,
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
                    IcoPath: pathIconHelp,
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
                    IcoPath: pathIconError,
                    score: 0,
                },
            ],
        })
    );
}

function hourglassValidateArgs(args) {
    const buffer = execFileSync(hourglassValidatorExe, args); //.toString();
    let jsonObj = JSON.parse(buffer);
    return jsonObj;
}
