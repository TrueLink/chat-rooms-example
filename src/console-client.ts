import readline = require('readline');
import roomModel = require("./room-model");
import uuid = require("node-uuid");
import routing = require("browser-relay-client/lib/routing");
import hub = require("browser-relay-client/lib/hub");
import chatProto = require("./chat-protocol");
import consoleProto = require("./console-protocol");

class ConsoleClient implements consoleProto.Callbacks, chatProto.Callbacks {
    private _console: consoleProto.Protocol;
    private _contacts: string[];
    private _rli: readline.ReadLine;
    private _rooms: roomModel.RoomModel[];
    private _activeRoom: string;
    private _username: string;
    private _hub: hub.HubAPI;
    private _protocol: chatProto.Protocol;

    constructor(options: {
        console: consoleProto.Protocol;
        hub: hub.HubAPI;
        protocol: chatProto.Protocol;
    }) {
        this._contacts = [];
        this._protocol = options.protocol;
        this._protocol.setReactions(this);

        this._console = options.console;
        this._console.setReactions(this);

        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });
        rl.setPrompt('--> ', 4);

        this._rli = rl;

        rl.on('line', (line: string) => {
            this._console.readLine(line);
            rl.prompt();
        });

        rl.on('close', function () {
            process.exit(0);
        });

        this._rooms = [];
        this._hub = options.hub;
        this._hub.onMessage.on(this._readMessage, this);
        this._hub.onRoutingChanged.on(this._routingChanged, this);
    }

    private _readMessage(message: any): void {
        this._protocol.readMessage(message);
    }

    private _getRoomById(id: string): roomModel.RoomModel {
        for (var i = 0; i < this._rooms.length; i++) {
            var room = this._rooms[i];
            if (room.id == id) return room;
        }
        return null;
    }

    private _getRoomByName(name: string): roomModel.RoomModel {
        for (var i = 0; i < this._rooms.length; i++) {
            var room = this._rooms[i];
            if (room.name == name) return room;
        }
        return null;
    }

    private _routingChanged(table: routing.RoutingTable): void {
        var nodes = table.children;
        var hub = this._hub;
        var contacts: string[] = [];

        for (var i = 0; i < nodes.length; i++) {
            var guid = nodes[i];
            if (guid == hub.guid) continue;
            contacts.push(guid);
        }

        this._contacts = contacts;
    }

    outputMessage(message: string): void {
        console.log(message);
    }

    onSay(replica: string): void {
        var activeRoom = this._getRoomById(this._activeRoom);

        if (!activeRoom) {
            this._console.writeNoActiveRoom();
            return;
        }

        var hub = this._hub;
        activeRoom.posted(hub.guid, replica);
        var allUsersInRoomExceptMe = activeRoom.users.filter((user) => { return user != hub.guid; });

        this._protocol.writePostReplica(allUsersInRoomExceptMe, activeRoom.id, hub.guid, replica);
    }

    onEnter(name: string): void {
        var room = this._getRoomByName(name);
        if (!room) {
            this._console.writeInvalidRoomName(name);
            return;
        }

        var hub = this._hub;

        room.userEntered(hub.guid);
        this._protocol.writeEnterRoom(this._contacts, room.id, hub.guid);
    }

    onLeave(name: string): void {
        var room = this._getRoomByName(name);
        if (!room) {
            this._console.writeInvalidRoomName(name);
            return;
        }

        var hub = this._hub;

        room.userLeft(hub.guid);
        this._protocol.writeLeaveRoom(this._contacts, room.id, hub.guid);
    }

    onGoto(name: string): void {
        var room = this._getRoomByName(name);
        if (!room) {
            this._console.writeInvalidRoomName(name);
            return;
        }

        this._activeRoom = room.id;
    }

    onCreate(name: string): void {
        var hub = this._hub;

        if (!name) {
            this._console.writeNameRequired();
            return;
        }

        var room = new roomModel.RoomModel({
            id: uuid.v4(),
            name: name
        });
        var rooms = this._rooms;
        rooms.push(room);

        this._protocol.writeCreateRoom(this._contacts, room.id, name);
    }

    onGetUserInfo(): void {
        this._console.writeUserInfo({
            id: this._hub.guid,
            name: this._username
        });
    }

    onSetUserInfo(name: string): void {
        this._username = name;
    }

    onGetActiveRoom(): void {
        var room = this._getRoomById(this._activeRoom);

        if (!room) {
            this._console.writeNoActiveRoom();
            return;
        }

        this._console.writeRoomInfo({
            id: room.id,
            name: room.name
        });
    }

    onGetListOfRooms(): void {
        this._console.writeRoomsList(this._rooms.map((room) => {
            return {
                id: room.id,
                name: room.name
            };
        }));
    }

    onGetUsersList(): void {
        var room = this._getRoomById(this._activeRoom);

        if (!room) {
            this._console.writeNoActiveRoom();
            return;
        }

        this._console.writeUsersList(room.users.map((id) => {
            this
            return {
                id: id,
                name: ""
            };
        }));
    }

    run(): void {
        this._rli.prompt();
    }

    writeMessage(destinations: string[], message: any): void {
        this._hub.sendAll(destinations, message);
    }

    readCreateRoom(id: string, name: string): void {
        var room = new roomModel.RoomModel({
            id: id,
            name: name
        });
        this._rooms.push(room);
    }

    readEnterRoom(roomId: string, userId: string): void {
        var room = this._getRoomById(roomId);
        room.userEntered(userId);
    }

    readLeaveRoom(roomId: string, userId: string): void {
        var room = this._getRoomById(roomId);
        room.userLeft(userId);
    }

    readPostReplica(roomId: string, userId: string, replica: string): void {
        var room = this._getRoomById(roomId);
        room.posted(userId, replica);
    }
}

var guid = uuid.v4();
var instance = hub.Hub.create(guid);
var chatProtocol = new chatProto.Protocol();
var client = new ConsoleClient({
    console: new consoleProto.Protocol(),
    hub: instance,
    protocol: chatProtocol
});

instance.connect("ws://127.0.0.1:20500/");
client.run();