
import Client from './client';
import Constant from './constant';
import path from 'path';
import fs from 'fs';
import http from 'http';
import HtmlTableToJson from 'html-table-to-json';


// YiActionCamera
class YiActionCamera {
    constructor() {
        this._client = new Client();
        this._config = Constant.config;
        this._autoConnect = true;
        this._ip = '192.168.42.1';
        this._port = 7878;
    }
    connect() {
        return this._client.connect(this._ip, this._port)
        .then(() => {
            return this._requestToken();
        })
        .then((token) => {
            this._client.token = token;
        });
    }
    disconnect() {
        this._client.disconnect();
    }
    takePhoto() {
        return this._sendAction(Constant.action.TAKE_PHOTO, function (data) {
            return (data.hasOwnProperty('type') && data.type == 'photo_taken');
        });
    }
    startRecord() {
        return this._sendAction(Constant.action.START_RECORD, function (data) {
            return (data.hasOwnProperty('type') && data.type == 'start_video_record');
        });
    }
    stopRecord() {
        return this._sendAction(Constant.action.STOP_RECORD, function (data) {
            return (data.hasOwnProperty('type') && data.type == 'video_record_complete');
        });
    }
    deleteFile(filePath) {
        return this._sendAction(Constant.action.DELETE_FILE, function (data) {
            return (data.hasOwnProperty('rval') && data.hasOwnProperty('msg_id') && data.msg_id == Constant.action.DELETE_FILE);
        }, filePath);
    }
    getConfig() {
        return this._sendAction(Constant.action.GET_CONFIG, function (data) {
            return (data.hasOwnProperty('rval') && data.hasOwnProperty('msg_id') && data.msg_id == Constant.action.GET_CONFIG);
        })
        .then(function (config) {
            var configObject = {};

            for (var index in config) {
                for (var propertyName in config[index]) {
                    configObject[propertyName] = config[index][propertyName];
                }
            }

            return configObject;
        });
    }
    setConfig(type, value) {
        return this._sendAction(Constant.action.SET_CONFIG, function (data) {
            return (data.hasOwnProperty('rval') && data.hasOwnProperty('msg_id') && data.msg_id == Constant.action.SET_CONFIG && data.hasOwnProperty('type') && data.type == type);
        }, value, type);
    }
    downloadFile(filePath, outputPath) {
        outputPath = outputPath || './';

        var fileHttpPath     = filePath.replace(/\/tmp\/fuse_d/, 'http://' + this._ip),
        outputFilePath   = path.join(outputPath, path.basename(filePath)),
        outputFileStream = fs.createWriteStream(outputFilePath);

        return new Promise(function (resolve, reject) {
            http.get(fileHttpPath, function (response) {
                response.pipe(outputFileStream, './');

                resolve(outputFilePath);
            })
            .on('error', function (err) {
                reject(err);
            });
        });
    }

     // Download fileList
    // filePath must start with '/tmp/fuse_d/'
    downloadFileList(filePath) {
        var fileHttpPath     = "";
        
        if (!filePath) {
            fileHttpPath = 'http://' + this._ip;
        }
        else {
            if (filePath.slice(-1) != '/') {
                filePath = filePath.substring(0, filePath.lastIndexOf('/') + 1);
            }
            fileHttpPath = filePath.replace(/\/tmp\/fuse_d/, 'http://' + this._ip);
        }
        console.log('fileHttpPath', fileHttpPath);
        return new Promise(function (resolve, reject) {
            http.get(fileHttpPath, function (response) {
                var html = "";
                response.on('data', function (chunk) {
                    html += chunk;
                });
                response.on('end', function () {
                    var ret = [];
                    var json = (new HtmlTableToJson(html)).results;
                    json = json[0].slice(1, json[0].length);
                    for (var i = 0; i < json.length; i++) {
                        ret.push({
                            name: json[i]['2'],
                            size: json[i]['3'] == '-' ? '0' : json[i]['3'],
                        });
                    }
                    resolve(ret);
                });
            })
            .on('error', function (err) {
                reject(err);
            });
        });
    }

    _sendAction(action, testFunc, param, type) {
        if (this._autoConnect && !this._client.isConnected()) {
            return this.connect()
            .then(() => {
                return this._client.sendAction(action, testFunc, param, type);
            });
        } else {
            return this._client.sendAction(action, testFunc, param, type);
        }
    }

    // Request token
    _requestToken() {
        return this._client.sendAction(Constant.action.REQUEST_TOKEN, function (data) {
            return (data.msg_id == Constant.action.REQUEST_TOKEN && data.hasOwnProperty('rval') && data.hasOwnProperty('param'));
        });
    }
}

export default YiActionCamera;
