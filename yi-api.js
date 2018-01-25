
import Client from './client';
import Constant from './constant';
import path from 'path';
import fs from 'fs';
import http from 'http';
import HtmlTableToJson from 'html-table-to-json';


// YiActionCamera
var YiActionCamera = {
    config: Constant.config,
    autoConnect: true,
    ip: '192.168.42.1',
    port: 7878,
    connect: function () {
        return Client.connect(YiActionCamera.ip, YiActionCamera.port)
        .then(function () {
            return requestToken();
        })
        .then(function (token) {
            Client.token = token;
        });
    },
    disconnect: function () {
        Client.disconnect();
    },
    takePhoto: function () {
        return sendAction(Constant.action.TAKE_PHOTO, function (data) {
            return (data.hasOwnProperty('type') && data.type == 'photo_taken');
        });
    },
    startRecord: function () {
        return sendAction(Constant.action.START_RECORD, function (data) {
            return (data.hasOwnProperty('type') && data.type == 'start_video_record');
        });
    },
    stopRecord: function () {
        return sendAction(Constant.action.STOP_RECORD, function (data) {
            return (data.hasOwnProperty('type') && data.type == 'video_record_complete');
        });
    },
    deleteFile: function (filePath) {
        return sendAction(Constant.action.DELETE_FILE, function (data) {
            return (data.hasOwnProperty('rval') && data.hasOwnProperty('msg_id') && data.msg_id == Constant.action.DELETE_FILE);
        }, filePath);
    },
    getConfig: function () {
        return sendAction(Constant.action.GET_CONFIG, function (data) {
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
    },
    setConfig: function (type, value) {
        return sendAction(Constant.action.SET_CONFIG, function (data) {
            return (data.hasOwnProperty('rval') && data.hasOwnProperty('msg_id') && data.msg_id == Constant.action.SET_CONFIG && data.hasOwnProperty('type') && data.type == type);
        }, value, type);
    },
    downloadFile: function (filePath, outputPath) {
        outputPath = outputPath || './';

        var fileHttpPath     = filePath.replace(/\/tmp\/fuse_d/, 'http://' + YiActionCamera.ip),
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
    },

    // Download fileList
    // filePath must start with '/tmp/fuse_d/'
    downloadFileList: function (filePath) {
        var fileHttpPath     = "";
        
        if (!filePath) {
            fileHttpPath = 'http://' + YiActionCamera.ip;
        }
        else {
            if (filePath.slice(-1) != '/') {
                filePath = filePath.substring(0, filePath.lastIndexOf('/') + 1);
            }
            fileHttpPath = filePath.replace(/\/tmp\/fuse_d/, 'http://' + YiActionCamera.ip);
        }
        return new Promise(function (resolve, reject) {
            http.get(fileHttpPath, function (response) {
                var html = "";
                response.on('data', function (chunk) {
                    html += chunk;
                });
                response.on('end', function () {
                    var json = (new HtmlTableToJson(html)).results;
                    resolve(json[0].slice(1, -1));
                });
            })
            .on('error', function (err) {
                reject(err);
            });
        });
    },
}

// Send action
function sendAction(action, testFunc, param, type) {
    if (YiActionCamera.autoConnect && !Client.isConnected()) {
        return YiActionCamera.connect()
        .then(function () {
            return Client.sendAction(action, testFunc, param, type);
        });
    } else {
        return Client.sendAction(action, testFunc, param, type);
    }
}

// Request token
function requestToken() {
    return Client.sendAction(Constant.action.REQUEST_TOKEN, function (data) {
        return (data.msg_id == Constant.action.REQUEST_TOKEN && data.hasOwnProperty('rval') && data.hasOwnProperty('param'));
    });
}

export default YiActionCamera;
