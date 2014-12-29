export interface Callbacks {
    outputMessage(message: string): void;

    onSay(replica: string): void;
    onEnter(room: string): void;
    onLeave(room: string): void;
    onGoto(room: string): void;
    onCreate(room: string): void;
    onGetUserInfo(): void;
    onSetUserInfo(name: string): void;
    onGetActiveRoom(): void;
    onGetListOfRooms(): void;
    onGetUsersList(): void;
}

export interface UserInfo {
    id: string;
    name: string;
}

export interface RoomInfo {
    id: string;
    name: string;
}

export class Protocol {
    private callbacks: Callbacks;

    constructor() {
    }

    public setReactions(callbacks: Callbacks) {
        this.callbacks = callbacks;
    }

    readLine(line: string) {
        var mo = line.match(/^\s*\/(\w+)\s*(.*)?$/);
        if (mo == null) {
            if (line.trim().length > 0) {
                this.callbacks.onSay(line.trim());
            }
            return;
        }
        var cmd = mo[1];
        var params = mo[2];

        switch (cmd) {
            case "enter":
                this.callbacks.onEnter(params);
                break;
            case "leave":
                this.callbacks.onLeave(params);
                break;
            case "goto":
                this.callbacks.onGoto(params);
                break;
            case "create": 
                this.callbacks.onCreate(params);
                break;
            case "name":
                if (params) {
                    this.callbacks.onSetUserInfo(params);
                } else {
                    this.callbacks.onGetUserInfo();
                }
                break;
            case "room":
                this.callbacks.onGetActiveRoom();
                break;
            case "rooms":
                this.callbacks.onGetListOfRooms();
                break;
            case "users":
                this.callbacks.onGetUsersList();
                break;
            case "help":
                this.writeHelp();
                break;
            default:
                this.callbacks.onSay(line);
                break;
        }
    }

    writeUserInfo(user: UserInfo): void {
        this.callbacks.outputMessage("You are `" + user.name + "` [" + user.id + "]");
    }

    writeUsersList(users: UserInfo[]): void {
        this.callbacks.outputMessage(users.map((user) => { return user.name + " [" + user.id + "]"; }).join("\n"));
    }

    writeRoomsList(rooms: RoomInfo[]): void {
        if (rooms.length == 0) {
            this.callbacks.outputMessage("There are no rooms created yet")
        } else {
            this.callbacks.outputMessage(rooms.map((room) => { return room.name + " [" + room.id + "]"; }).join("\n"));
        }
    }

    writeRoomInfo(room: RoomInfo): void {
        this.callbacks.outputMessage("You are in room `" + room.name + "` [" + room.id + "]")
    }

    writeHelp(): void {
        this.callbacks.outputMessage([
            "/create <room-name>",
            "/enter <room-name>",
            "/leave <room-name>",
            "/goto <room-name>",
            "/name",
            "/name <new-name>",
            "/room",
            "/rooms",
            "/users",
            "/help"
        ].join("\n"));
    }

    writeInvalidRoomName(name: string) {
        this.callbacks.outputMessage("No room with such name `" + name + "`");
    }

    writeNoActiveRoom() {
        this.callbacks.outputMessage("Active room was not selected. Use `/goto` command.")
    }

    writeNameRequired() {
        this.callbacks.outputMessage("Name parameter required for this command.")
    }
}

