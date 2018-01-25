Example Usage:

import YiActionCamera from "./yi-api";

var yi = YiActionCamera;

var fileListPath = "/tmp/fuse_d/DCIM/"

yi.connect()
    .then(function () {
        return yi.downloadFileList(fileListPath);
    })
    .then(function (json) {
        console.log('file list', json);
        return yi.disconnect();
    })
    .then(function () {
        console.log('disconnected');
    })
    .catch(function (err) {
        console.error(err);
    });
