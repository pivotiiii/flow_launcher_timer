import {ChildProcess, execFileSync, spawn} from "child_process";
import path from "path";
import {fileURLToPath} from "url";

import open from "open";
//import {error} from "console";

const __dirname: string = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../");
const hourglassDir: string = path.resolve(__dirname, "hourglass");
const hourglassExe: string = path.resolve(hourglassDir, "Hourglass.exe");
const hourglassValidatorExe: string = path.resolve(hourglassDir, "hourglass_args_validator.exe");

const pathIconApp: string = path.resolve(__dirname, "img", "app.png");
const pathIconError: string = path.resolve(__dirname, "img", "err.png");
const pathIconHelp: string = path.resolve(__dirname, "img", "help.png");

const hourglassResumeCommand: string = "resume";
const hourglassPauseCommand: string = "pause";
const hourglassCommands = {
    [hourglassResumeCommand]: ["resume", "continue", "go"],
    [hourglassPauseCommand]: ["pause", "wait", "stop"],
};

interface FlowLauncherSettings {
    theme: string;
    useDarkTheme: boolean;
    prefer24h: boolean;
    displayDigital: boolean;
    elapsedTime: boolean;
}

interface FlowLauncherInput {
    method: string;
    parameters: string[];
    settings: FlowLauncherSettings;
}
const {method, parameters, settings}: FlowLauncherInput = JSON.parse(process.argv[2]);

if (method === "query") {
    // if (parameters[0].split(" ")[0] === "debug") error(process.argv[2]); //for  debugging
    const query: string = parameters[0];
    if (query.length > 0) {
        parseQuery(query, settings);
    } else {
        logEmptyQuery();
    }
} else if (method === "startTimer") {
    //error([process.argv[2], parameters]); //for debugging
    const child: ChildProcess = spawn(hourglassExe, parameters, {
        detached: true,
        stdio: "ignore",
    });
    child.unref();
} else if (method === "showHelp") {
    open(path.resolve(__dirname, "help", "help.html"));
}

function parseQuery(query: string, settings: FlowLauncherSettings) {
    try {
        for (const [key, value] of Object.entries(hourglassCommands)) {
            if (value.includes(query)) {
                logCommand(key);
                return;
            }
        }

        const splitQuery: string[] = query.split(" ");
        let title: string | null = null;

        const validatorResult: HourglassValidatorResult = hourglassValidateArgs([query]);

        let isValidArgs: boolean = validatorResult.result;
        let timeString: string | null = validatorResult.timeStrings.length > 0 ? validatorResult.timeStrings[0] : null;

        // if the query is not valid, it may be because there is an added title in the query
        if (!isValidArgs) {
            if (splitQuery.length > 1) {
                // use scoped block to be able to break to save rerunning validator or ugly if-else chains
                validateArgsChain: {
                    // check if the last argument is a title, then check if first argument is
                    const titleLast: string = splitQuery.slice(splitQuery.length - 1, splitQuery.length)[0];
                    const argsRemainingTitleLast: string[] = splitQuery.slice(0, splitQuery.length - 1);
                    const validatorResultTitleLast: HourglassValidatorResult = hourglassValidateArgs(["--title", titleLast, argsRemainingTitleLast.join(" ")]);
                    if (validatorResultTitleLast.result) {
                        isValidArgs = true;
                        title = titleLast;
                        query = argsRemainingTitleLast.join(" ");
                        timeString = validatorResultTitleLast.timeStrings.length > 0 ? validatorResultTitleLast.timeStrings[0] : null;
                        break validateArgsChain;
                    }

                    // check if the first argument is a title
                    const titleFirst: string = splitQuery.slice(0, 1)[0];
                    const argsRemainingTitleFirst: string[] = splitQuery.slice(1, splitQuery.length);
                    const validatorResultTitleFirst: HourglassValidatorResult = hourglassValidateArgs(["--title", titleFirst, argsRemainingTitleFirst.join(" ")]);
                    if (validatorResultTitleFirst.result) {
                        isValidArgs = true;
                        title = titleFirst;
                        query = argsRemainingTitleFirst.join(" ");
                        timeString = validatorResultTitleFirst.timeStrings.length > 0 ? validatorResultTitleFirst.timeStrings[0] : null;
                        break validateArgsChain;
                    }

                    //check if the query contains a quoted title with spaces
                    const regex: RegExp = /(["'])(.*?)\1/; // matches quoted string with single or double quotes
                    if (regex.test(query)) {
                        const tempQuery: string = query.replace(regex, "").trim(); // remove the quoted title, trim
                        const tempTitle: string = query.match(regex)![0].replace(/["']/g, ""); // extract the quoted title without quotes
                        const validatorResultQuoted: HourglassValidatorResult = hourglassValidateArgs(["--title", tempTitle, tempQuery]);
                        if (validatorResultQuoted.result) {
                            isValidArgs = true;
                            title = tempTitle;
                            query = tempQuery;
                            timeString = validatorResultQuoted.timeStrings.length > 0 ? validatorResultQuoted.timeStrings[0] : null;
                            break validateArgsChain;
                        }
                    }

                    // if we reach here, then the query is invalid
                    logInvalidQuery();
                    return;
                }
            } else {
                logInvalidQuery();
                return;
            }
        }

        if (isValidArgs) {
            const optionsArray: string[] = ["--loop-sound", "on", "--window-title", "title"];

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
    } catch (error: any) {
        logHourglassError(error);
        return;
    }
}

interface HourglassValidatorResult {
    result: boolean;
    timeStrings: string[];
}

function hourglassValidateArgs(args: string[]) {
    const buffer = execFileSync(hourglassValidatorExe, args); //.toString();
    const jsonObj: HourglassValidatorResult = JSON.parse(buffer.toString());
    return jsonObj;
}

interface FlowLauncherReturnItem {
    Title: string;
    Subtitle: string;
    JsonRPCAction: {
        method: string;
        parameters: string[];
    };
    IcoPath: string;
    score: number;
}

interface FlowLauncherReturnObject {
    result: FlowLauncherReturnItem[];
}

function logToFlowLauncher(returnItems: FlowLauncherReturnItem[]) {
    const returnObject: FlowLauncherReturnObject = {result: returnItems};
    console.log(JSON.stringify(returnObject));
}

function logValidQuery(timeString: string | null, optionsArray: string[], title: string | null) {
    const description: string =
        (timeString != null ? timeString : "") + //time
        (timeString != null && title != null ? " - " : "") + //dash if both
        (title != null ? `Title: ${title}` : ""); //only title

    const startTimerItem: FlowLauncherReturnItem = {
        Title: "Start timer",
        Subtitle: description,
        JsonRPCAction: {
            method: "startTimer",
            parameters: optionsArray,
        },
        IcoPath: pathIconApp,
        score: 100,
    };

    const startTimerAlwaysOnTopItem: FlowLauncherReturnItem = {
        Title: "Start timer (always on top)",
        Subtitle: description,
        JsonRPCAction: {
            method: "startTimer",
            parameters: ["--always-on-top", "on", ...optionsArray],
        },
        IcoPath: pathIconApp,
        score: 0,
    };

    const startTimerMinimizedItem: FlowLauncherReturnItem = {
        Title: "Start timer (minimized)",
        Subtitle: description,
        JsonRPCAction: {
            method: "startTimer",
            parameters: ["--window-state", "minimized", ...optionsArray],
        },
        IcoPath: pathIconApp,
        score: -100,
    };

    logToFlowLauncher([startTimerItem, startTimerAlwaysOnTopItem, startTimerMinimizedItem]);
}

function logCommand(command: string) {
    let description = null;
    switch (command) {
        case hourglassResumeCommand:
            description = "Resume all paused timers.";
            break;
        case hourglassPauseCommand:
            description = "Pause all running timers.";
            break;
        default:
            console.log(JSON.stringify({result: []})); //??
            return;
    }

    const runCommandItem: FlowLauncherReturnItem = {
        Title: description,
        Subtitle: "",
        JsonRPCAction: {
            method: "startTimer",
            parameters: [command],
        },
        IcoPath: pathIconApp,
        score: 0,
    };

    logToFlowLauncher([runCommandItem]);
}

function logEmptyQuery() {
    const pauseTimersItem: FlowLauncherReturnItem = {
        Title: "Pause all running timers.",
        Subtitle: "",
        JsonRPCAction: {
            method: "startTimer",
            parameters: ["pause"],
        },
        IcoPath: pathIconApp,
        score: 0,
    };

    const resumeTimersItem: FlowLauncherReturnItem = {
        Title: "Resume all running timers.",
        Subtitle: "",
        JsonRPCAction: {
            method: "startTimer",
            parameters: ["resume"],
        },
        IcoPath: pathIconApp,
        score: 0,
    };

    logToFlowLauncher([pauseTimersItem, resumeTimersItem]);
}

function logInvalidQuery() {
    const invalidQueryItem: FlowLauncherReturnItem = {
        Title: "Show help",
        Subtitle: "Invalid time input",
        JsonRPCAction: {
            method: "showHelp",
            parameters: [],
        },
        IcoPath: pathIconHelp,
        score: 0,
    };

    logToFlowLauncher([invalidQueryItem]);
}

function logHourglassError(error: any) {
    const hourglassErrorItem: FlowLauncherReturnItem = {
        Title: "Error running dependency Hourglass.exe",
        Subtitle: `Please try reinstalling the plugin. (${error.message})`,
        JsonRPCAction: {
            method: "",
            parameters: [],
        },
        IcoPath: pathIconError,
        score: 0,
    };

    logToFlowLauncher([hourglassErrorItem]);
}
