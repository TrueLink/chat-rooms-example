import react = require("react");
import TypedReact = require("typed-react");
import uuid = require("node-uuid");
import client = require("browser-relay-client");
import routing = require("browser-relay-client/lib/routing");
import hub = require("browser-relay-client/lib/hub");
var RD = react.DOM;

export interface AppProps {
}

interface AppState {
}

class AppClass extends TypedReact.Component<AppProps, AppState> {
    getInitialState(): AppState {
        return {
        };
    }

    componentDidMount() {
        var hub = this.props.hub;
    }

    componentWillUnmount() {
        var hub = this.props.hub;
    }

    render() {
        var hub = this.props.hub;
        return RD.div(null,
            RD.h1(null, "GUID: ", RD.span({
                className: "guid"
            }, hub.guid))
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
