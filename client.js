import net from "net";
import Constant from "./constant";

class Client {
    constructor(){
        this._socketClient = new net.Socket();
        this._listeners = [];
        this._connected = false;
        this._connecting = false;
        this.token= null;
        // On client receive data
        this._socketClient.on('data', (data) => {
            data = JSON.parse(data);

            this._listeners.filter(function (listener) {
                return !listener(data);
            });
        });

        // On client close
        this._socketClient.on('close', (had_error) => {
            if (this._connected) {
                this._connected = false;
                this.token = null;

                this._socketClient.destroy();

                if (had_error) {
                    console.error('Transmission error');
                }
            }
        });
    }

    isConnected () {
        return this._connected;
    }

    connect(ip, port) {
        return new Promise((resolve, reject) => {
            if (this._connected) {
                reject('Already connected');
                return;
            }

            if (this._connecting) {
                reject('Already trying connecting');
                return;
            }

            this._connecting = true;

            var onError = (err) => {
                this._connecting = false;
                reject(err);
            };

            this._socketClient.once('error', onError);

            this._socketClient.connect(port, ip, () => {
                this._connected = true;
                this._connecting = false;
                this._socketClient.removeListener('error', onError);
                resolve();
            });
        });
    }

    disconnect() {
        return new Promise((resolve) => {
            this._socketClient.on('end', function () {
                resolve();
            });

            this._connected = false;
            this.token = null;

            this._socketClient.end();
        });
    }

    sendAction(action, testFunc, param, type) {
        return new Promise((resolve) => {
            var message = {
                msg_id: action,
                token:  action == Constant.action.REQUEST_TOKEN ? 0 : Client.token
            };

            if (param) {
                message.param = param;
            }

            if (type) {
                message.type = type;
            }

            this._sendMessage(message, testFunc, resolve);
        });
    }
    _sendMessage(message, testFunc, resolve) {
        if (testFunc) {
            this._listeners.push((data) => {
                var result = !!testFunc(data);
                if (result) {
                    resolve(data.hasOwnProperty('param') ? data.param : null);
                }
                return result;
            });
        }
        this._socketClient.write(JSON.stringify(message));
    }
}
/*
    return {
        isConnected: this.isConnected,
        connect: this.connect,
        disconnect: this.disconnect,
        sendAction: this.sendAction,
    };
*/
export default Client;