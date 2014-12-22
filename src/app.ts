import react = require("react");
import TypedReact = require("typed-react");
import uuid = require("node-uuid");
import client = require("browser-relay-client");
import routing = require("browser-relay-client/lib/routing");
import hub = require("browser-relay-client/lib/hub");
import rampConnection = require("./ramp-connection");
import roomModel = require("./room-model");
import roomsItem = require("./rooms-item");
import chat = require("./chat");
var RD = react.DOM;

export interface AppProps {
    hub: hub.HubAPI
    ramps?: string[];
}

interface AppState {
    currentRamps?: string[];
    contacts?: string[];
    routing?: string[][];
    rooms?: roomModel.RoomModel[];
    activeRoom?: string;
    participatedRooms?: roomModel.RoomModel[];
}

class AppClass extends TypedReact.Component<AppProps, AppState> {
    getInitialState(): AppState {
        return {
            currentRamps: this.props.ramps,
            contacts: [],
            routing: [],
            rooms: [],
            participatedRooms: []
        };
    }

    private _getRoomById(id: string): roomModel.RoomModel {
        for (var i = 0; i < this.state.rooms.length; i++) {
            var room = this.state.rooms[i];
            if (room.id == id) return room;
        }
        return null;
    }

    private _messageReceived(message: any): void {
        var messageType: string = message.type;
        switch (messageType) {
            case "create-room":
                var roomId: string = message.id;
                var name: string = message.name;
                var room = new roomModel.RoomModel({
                    id: roomId,
                    name: name
                });
                var rooms = this.state.rooms;
                rooms.push(room);
                this.setState({
                    rooms: rooms
                });
                break;
            case "enter-room":
                var roomId: string = message.room;
                var userId: string = message.user;
                var room = this._getRoomById(roomId);
                room.userEntered(userId);
                break;
            case "leave-room":
                var roomId: string = message.room;
                var userId: string = message.user;
                var room = this._getRoomById(roomId);
                room.userLeft(userId);
                break;
            case "post-message":
                var roomId: string = message.room;
                var userId: string = message.user;
                var replica: string = message.replica;
                var room = this._getRoomById(roomId);
                room.posted(userId, replica);
                break;
        }
    }

    private _addRamp(event: React.FormEvent) {
        event.preventDefault();

        var hub = this.props.hub;
        var form = <HTMLFormElement>event.target;
        var addr = <HTMLInputElement>form.elements.item("addr");
        if (!addr.value) return false;

        var ramps = this.state.currentRamps;
        ramps.push(addr.value);

        this.setState({
            currentRamps: ramps
        });

        form.reset();

        return false;
    }

    private _routingChanged(table: routing.RoutingTable): void {
        var nodes = table.children;
        var hub = this.props.hub;
        var contacts: string[] = [];

        for (var i = 0; i < nodes.length; i++) {
            var guid = nodes[i];
            if (guid == hub.guid) continue;
            contacts.push(guid);
        }

        this.setState({
            contacts: contacts,
            routing: table.serialize()
        });
    }

    private _sendMessage(event: React.FormEvent) {
        event.preventDefault();

        var hub = this.props.hub;
        var form = <HTMLFormElement>event.target;
        var message = <HTMLInputElement>form.elements.item("message");

        var activeRoom = this._getRoomById(this.state.activeRoom);
        activeRoom.posted(hub.guid, message.value);

        hub.sendAll(activeRoom.users.filter((user) => { return user != hub.guid; }), {
            type: "post-message",
            room: activeRoom.id,
            user: hub.guid,
            replica: message.value
        });
        message.value = message.defaultValue;
        return false;
    }

    private _createRoom(event: React.FormEvent) {
        event.preventDefault();

        var hub = this.props.hub;
        var form = <HTMLFormElement>event.target;
        var name = <HTMLInputElement>form.elements.item("name");
        if (!name.value) return false;

        var room = new roomModel.RoomModel({
            id: uuid.v4(),
            name: name.value
        });
        var rooms = this.state.rooms;
        rooms.push(room);
        this.setState({
            rooms: rooms
        });

        hub.sendAll(this.state.contacts, {
            type: "create-room",
            id: room.id,
            name: room.name
        });

        name.value = name.defaultValue;

        return false;
    }

    private _enterRoom(room: roomModel.RoomModel) {
        var hub = this.props.hub;
        room.userEntered(hub.guid);
        this.setState({
            participatedRooms: this.state.rooms.filter((room) => {
                return room.users.indexOf(hub.guid) >= 0;
            })
        });

        hub.sendAll(this.state.contacts, {
            type: "enter-room",
            room: room.id,
            user: hub.guid
        });
    }

    private _leaveRoom(room: roomModel.RoomModel) {
        var hub = this.props.hub;
        room.userLeft(hub.guid);
        this.setState({
            activeRoom: room.id != this.state.activeRoom ? this.state.activeRoom : null,
            participatedRooms: this.state.rooms.filter((room) => {
                return room.users.indexOf(hub.guid) >= 0;
            })
        });

        hub.sendAll(this.state.contacts, {
            type: "leave-room",
            room: room.id,
            user: hub.guid
        });
    }

    private _activateRoom(room: roomModel.RoomModel) {
        this.setState({
            activeRoom: room.id
        });
    }

    componentDidMount() {
        var hub = this.props.hub;
        hub.onMessage.on(this._messageReceived, this);
        hub.onRoutingChanged.on(this._routingChanged, this);
    }

    componentWillUnmount() {
        var hub = this.props.hub;
        hub.onMessage.off(this._messageReceived, this);
        hub.onRoutingChanged.off(this._routingChanged, this);
    }

    render() {
        var hub = this.props.hub;
        var room = this._getRoomById(this.state.activeRoom);
        return RD.div(null,
            RD.h1(null, "GUID: ", RD.span({ className: "guid" }, hub.guid)),

            RD.form({ id: "room-form", onSubmit: this._createRoom }),
            RD.table({
                className: "layout"
            },
                RD.tbody(null,
                    RD.tr(null,
                        RD.td(null,
                            room ? chat.Chat({ room: room }) : null
                        ),
                        RD.td({
                            className: "rooms"
                        },
                            this.state.rooms.map((room, index) => {
                                return roomsItem.Item({
                                    key: room.id,
                                    room: room,
                                    active: this.state.activeRoom == room.id,
                                    entered: room.users.indexOf(hub.guid) >= 0,
                                    setActive: this._activateRoom.bind(this),
                                    enterRoom: this._enterRoom.bind(this),
                                    leaveRoom: this._leaveRoom.bind(this)
                                });
                            }),
                            RD.input({ type: "text", form: "room-form", name: "name" }),
                            RD.input({ type: "submit", form: "room-form", value: "Create new room" })
                            )
                        )
                    )
                ),
            RD.form({
                className: "message-form",
                onSubmit: this._sendMessage
            },
                RD.input({ type: "text", name: "message" }),
                RD.input({ type: "submit", value: "Send" })
            ),
            RD.h2(null, "Ramp servers"),
            this.state.currentRamps.map((addr) => {
                return rampConnection.RampConnection({
                    key: addr,
                    hub: hub,
                    addr: addr
                });
            }),
            RD.form({
                onSubmit: this._addRamp
            },
                RD.input({ type: "text", name: "addr" }),
                RD.input({ type: "submit", value: "Add" })
            ),
            RD.h2(null, "Routing table"),
            RD.table({ className: "routing" },
                RD.thead(null,
                    RD.tr(null,
                        RD.th(null, "Origin"),
                        RD.th(null, "Endpoint")
                        )
                    ),
                RD.tbody(null,
                    this.state.routing.map((row) => {
                        return RD.tr(null,
                            RD.td({ className: "guid" }, row[0]),
                            RD.td(null, row[2])
                            );
                    })
                    )
                )
            );
    }
}

export var App = react.createFactory(TypedReact.createClass<AppProps, AppState>(AppClass));

window.addEventListener("load", function () {
    var guid = uuid.v4();
    var instance = hub.Hub.create(guid);
    var app = App({
        hub: instance,
        ramps: [
            "ws://127.0.0.1:20500/",
            "ws://127.0.0.1:20501/"
        ]
    });
    react.render(app, document.body);
});

window.addEventListener("error", function () {
    console.log.call(console, arguments);
});
