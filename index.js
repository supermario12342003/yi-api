import Constant from "./constant";
import Client from "./client";
import HtmlTableToJson from 'html-table-to-json';
import YiActionCamera from "./yi-api";

console.log(Constant.action);
console.log(Client.isConnected());

var yi = YiActionCamera;

yi.connect()
.then(function() {
	console.log('connected');
	return yi.downloadFileList("/tmp/fuse_d/DCIM/");
})
.then(function (fileList) {
	console.log('fileList', fileList);
	return yi.disconnect();
})
.then(function () {
	console.log('disconnected');
})
.catch(function (err) {
	console.error(err);
});