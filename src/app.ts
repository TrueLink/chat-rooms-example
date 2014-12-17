import react = require("react");
import TypedReact = require("typed-react");
import uuid = require("node-uuid");
import client = require("browser-relay-client");
import routing = require("browser-relay-client/lib/routing");
import event = require("browser-relay-client/lib/event");
import hub = require("browser-relay-client/lib/hub");
import rampConnection = require("./ramp-connection");
var RD = react.DOM;

interface ChatMessage {
    user: string;
    replic: string;
}

class RoomModel {
    public onEnterRoom: event.Event<boolean> = new event.Event<boolean>();
    public onLeaveRoom: event.Event<boolean> = new event.Event<boolean>();
    public onPost: event.Event<string> = new event.Event<string>();
    public onChange: event.Event<boolean> = new event.Event<boolean>();

    public get id(): string {
        return this._id;
    }

    private _messages: ChatMessage[] = [];
    private _users: string[] = [];
    private _id: string = uuid.v4();

    public userEntered(user: string): void {
        var index = this._users.indexOf(user);
        if (index >= 0) return;
        this._users.push(user);
        this.onChange.emit(false);
    }

    public userLeft(user: string): void {
        var index = this._users.indexOf(user);
        if (index == -1) return;
        this._users.splice(index, 1);
        this.onChange.emit(false);
    }

    public posted(user: string, replic: string): void {
        var index = this._users.indexOf(user);
        if (index == -1) return;
        this._messages.push({
            user: user,
            replic: replic
        });
        this.onChange.emit(false);
    }
}

export interface AppProps {
    hub: hub.HubAPI
    ramps?: string[];
}

interface AppState {
    currentRamps?: string[];
    contacts?: string[];
    routing?: string[][];
    rooms?: RoomModel[];
    activeRoom?: string;

}

class AppClass extends TypedReact.Component<AppProps, AppState> {
    getInitialState(): AppState {
        return {
            currentRamps: this.props.ramps,
            contacts: [],
            routing: [],
            rooms: []
        };
    }

    private _getRoomById(id: string): RoomModel {
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
                var roomName: string = message.name;
                break;
            case "enter-room":
                var roomId: string = message.room;
                var userId: string = message.user;
                break;
            case "leave-room":
                var roomId: string = message.room;
                var userId: string = message.user;
                break;
            case "post-message":
                var roomId: string = message.room;
                var userId: string = message.user;
                var replic: string = message.replic;

                break;
        }
    }

    private _addRamp(event: React.FormEvent) {
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

        event.preventDefault();
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
        var hub = this.props.hub;
        var form = <HTMLFormElement>event.target;
        var message = <HTMLInputElement>form.elements.item("message");

        hub.sendAll(this.state.contacts, message.value);
        message.value = message.defaultValue;
        event.preventDefault();
        return false;
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
        return RD.div(null,
            RD.h1(null, "GUID: ", RD.span({
                className: "guid"
            }, hub.guid)),
            RD.form({
                onSubmit: this._sendMessage,
                className: "submit-form"
            },
                RD.input({
                    type: "text",
                    name: "message"
                }),
                RD.input({
                    type: "submit",
                    value: "Send"
                })
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
