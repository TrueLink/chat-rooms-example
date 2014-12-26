export interface Callbacks {
    writeMessage(destinations: string[], message: any): void;

    readCreateRoom(id: string, name: string): void;
    readEnterRoom(roomId: string, userId: string): void;
    readLeaveRoom(roomId: string, userId: string): void;
    readPostReplice(roomId: string, userId: string, replica: string): void;
}

export class Protocol {
    private callbacks: Callbacks;

    constructor() {
    }

    public setReactions(callbacks: Callbacks) {
        this.callbacks = callbacks;
    }

    readMessage(message: any): void {
        var messageType: string = message.type;
        switch (messageType) {
            case "create-room":
                var roomId: string = message.id;
                var name: string = message.name;
                this.callbacks.readCreateRoom(roomId, name);
                break;
            case "enter-room":
                var roomId: string = message.room;
                var userId: string = message.user;
                this.callbacks.readEnterRoom(roomId, userId);
                break;
            case "leave-room":
                var roomId: string = message.room;
                var userId: string = message.user;
                this.callbacks.readLeaveRoom(roomId, userId);
                break;
            case "post-message":
                var roomId: string = message.room;
                var userId: string = message.user;
                var replica: string = message.replica;
                this.callbacks.readPostReplice(roomId, userId, replica);
                break;
        }
    }

    writeCreateRoom(destinations: string[], roomId: string, roomName: string): void {
        var message = {
            type: "create-room",
            id: roomId,
            name: roomName
        };
        this.callbacks.writeMessage(destinations, message);
    }

    writeEnterRoom(destinations: string[], roomId: string, userId: string): void {
        var message = {
            type: "enter-room",
            user: userId,
            room: roomId,
        };
        this.callbacks.writeMessage(destinations, message);
    }

    writeLeaveRoom(destinations: string[], roomId: string, userId: string): void {
        var message = {
            type: "leave-room",
            user: userId,
            room: roomId
        };
        this.callbacks.writeMessage(destinations, message);
    }

    writePostReplica(destinations: string[], roomId: string, userId: string, replica: string): void {
        var message = {
            type: "post-message",
            user: userId,
            room: roomId,
            replica: replica
        };
        this.callbacks.writeMessage(destinations, message);
    }
}