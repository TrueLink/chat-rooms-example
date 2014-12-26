import readline = require('readline');

export interface Callbacks {
    consoleMessage(message: string): void;

    onSay(replica: string): void;
    onEnter(room: string): void;
    onLeave(room: string): void;
    onGoto(room: string): void;
    onCreate(room: string): void;
    onGetUserInfo(): void;
    onSetUserInfo(name: string): void;
    onGetActiveRoom(): void;
    onGetUsersList(): void;
}

class ConsoleProtocol {
    private callbacks: Callbacks;

    constructor() {
    }

    public setReactions(callbacks: Callbacks) {
        this.callbacks = callbacks;
    }

    readLine(line: string) {
        var mo = line.match(/^\s*(\w+)\s*(.*)?$/);
        var cmd = mo[1];
        var params = mo[2];

        switch (cmd) {
            case "say":
                this.callbacks.onSay(params);
                break;
            case "enter":
                this.callbacks.onEnter(params);
                break;
            case "leave": 
                this.callbacks.onLeave(params);
                break;
            case "goto":
                this.callbacks.onGoto(params);
                break;
            case "create": break;
                this.callbacks.onCreate(params);
                break;
            case "whoami":
                this.callbacks.onGetUserInfo();
                break;
            case "iam":
                this.callbacks.onSetUserInfo(params);
                break;
            case "whereami":
                this.callbacks.onGetActiveRoom();
                break;
            case "whosthere":
                this.callbacks.onGetUsersList();
                break;
            default: break;
        }
    }
}

class ConsoleClient {
    private _protocol: ConsoleProtocol;
    private _rli: readline.ReadLine;

    constructor(options: {
        protocol: ConsoleProtocol
    }) {
        this._protocol.setReactions(this);
        this._protocol = options.protocol;
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });
        rl.setPrompt('--> ', 4);
        rl.prompt();
        this._rli = rl;

        rl.on('line', (line: string) => {
            this._protocol.readLine(line);
            rl.prompt();
        });

        rl.on('close', function () {
            process.exit(0);
        });
    }

    consoleMessage(message: string): void {
        console.log(message);
    }

    onSay(replica: string): void {
    }

    onEnter(room: string): void {
    }

    onLeave(room: string): void {
    }

    onGoto(room: string): void {
    }

    onCreate(room: string): void {
    }

    onGetUserInfo(): void {
    }

    onSetUserInfo(name: string): void {
    }

    onGetActiveRoom(): void {
    }

    onGetUsersList(): void {
    }
}