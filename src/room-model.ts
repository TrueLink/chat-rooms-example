import event = require("browser-relay-client/lib/event");

export interface ChatMessage {
    user: string;
    replica: string;
}

export class RoomModel {
    public onEnterRoom: event.Event<string> = new event.Event<string>();
    public onLeaveRoom: event.Event<string> = new event.Event<string>();
    public onPost: event.Event<ChatMessage> = new event.Event<ChatMessage>();

    public get id(): string {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public get messages(): ChatMessage[] {
        return this._messages.concat();
    }

    public get users(): string[] {
        return this._users.concat();
    }

    private _messages: ChatMessage[] = [];
    private _users: string[] = [];
    private _id: string;
    private _name: string;

    constructor(options: { id: string; name: string }) {
        this._id = options.id;
        this._name = options.name;
    }

    public userEntered(user: string): void {
        var index = this._users.indexOf(user);
        if (index >= 0) return;
        this._users.push(user);
        this.onEnterRoom.emit(user);
    }

    public userLeft(user: string): void {
        var index = this._users.indexOf(user);
        if (index == -1) return;
        this._users.splice(index, 1);
        this.onLeaveRoom.emit(user);
    }

    public posted(user: string, replica: string): void {
        var message = {
            user: user,
            replica: replica
        };
        this._messages.push(message);
        this.onPost.emit(message);
    }
}
