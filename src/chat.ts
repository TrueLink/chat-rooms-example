import react = require("react");
import TypedReact = require("typed-react");
import roomModel = require("./room-model");
var RD = react.DOM;

export interface ChatProps {
    room: roomModel.RoomModel;
}

interface ChatState {
    messages?: roomModel.ChatMessage[];
    users?: string[];
}

class ChatClass extends TypedReact.Component<ChatProps, ChatState> {
    getInitialState(props?: ChatProps): ChatState {
        var room = (props || this.props).room;
        return {
            messages: room.messages,
            users: room.users
        };
    }

    private _onEntered(user: string): void {
        var room = this.props.room;
        this.setState({
            users: room.users
        });
    }

    private _onLeft(user: string): void {
        var room = this.props.room;
        this.setState({
            users: room.users
        });
    }

    private _onPosted(message: roomModel.ChatMessage) {
        var room = this.props.room;
        this.setState({
            messages: room.messages
        });
    }

    componentWillReceiveProps(props: ChatProps) {
        this.setState(this.getInitialState(props));
        this.componentWillUnmount();
        this.componentDidMount(props);
    }

    componentDidMount(props?: ChatProps) {
        var room = (props || this.props).room;
        room.onEnterRoom.on(this._onEntered, this);
        room.onLeaveRoom.on(this._onLeft, this);
        room.onPost.on(this._onPosted, this);
    }

    componentWillUnmount() {
        var room = this.props.room;
        room.onEnterRoom.off(this._onEntered, this);
        room.onLeaveRoom.off(this._onLeft, this);
        room.onPost.off(this._onPosted, this);
    }

    public render() {
        return RD.div({
            id: "log",
        },
            this.state.messages.map((message, index) => {
                return RD.p({
                    key: index.toString(),
                    className: "chat-message"
                },
                    RD.span({ className: "chat-user" }, message.user),
                    RD.span({ className: "chat-replica" }, message.replica)
                    );
                })
            );
    }
}

export var Chat = react.createFactory(TypedReact.createClass<ChatProps, ChatState>(ChatClass));
