import react = require("react");
import TypedReact = require("typed-react");
import roomModel = require("./room-model");
var RD = react.DOM;

export interface ItemProps {
    room: roomModel.RoomModel;
    active: boolean;
    entered: boolean;
    setActive: (room: roomModel.RoomModel) => void;
    enterRoom: (room: roomModel.RoomModel) => void;
    leaveRoom: (room: roomModel.RoomModel) => void;
}

interface ItemState {
    unreadCount?: number;
}

class ItemClass extends TypedReact.Component<ItemProps, ItemState> {
    getInitialState(): ItemState {
        return {
            unreadCount: 0
        };
    }
    private _enter() {
        this.props.enterRoom(this.props.room);
    }

    private _leave() {
        this.props.leaveRoom(this.props.room);
    }

    private _activate() {
        var room = this.props.room;
        this.setState({
            unreadCount: 0
        });
        this.props.setActive(this.props.room);
        return false;
    }

    private _messageReceived() {
        if (this.props.active) return;
        this.setState({
            unreadCount: this.state.unreadCount + 1
        });
    }

    componentDidMount() {
        var room = this.props.room;
        room.onPost.on(this._messageReceived, this);
    }

    componentWillUnmount() {
        var room = this.props.room;
        room.onPost.off(this._messageReceived, this);
    }

    render() {
        var room = this.props.room;
        return this.props.entered
            ? RD.div(null,
                RD.button({ onClick: this._leave }, "Leave"),
                this.props.active
                ? RD.span(null, room.name)
                : RD.a({ href: "#", onClick: this._activate },
                    room.name,
                    this.state.unreadCount > 0
                    ? " (" + this.state.unreadCount + ")"
                    : null
                    )
                )
            : RD.div(null,
                RD.button({ onClick: this._enter }, "Enter"),
                RD.span(null, room.name)
                );
    }
}

export var Item = react.createFactory(TypedReact.createClass<ItemProps, ItemState>(ItemClass));
