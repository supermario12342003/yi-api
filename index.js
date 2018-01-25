export * from './yi-api';
/*
import Constant from "./constant";
import Client from "./client";
//import HtmlTableToJson from 'html-table-to-json';
import YiActionCamera from "./yi-api";

console.log(Constant.action);
var yi = new YiActionCamera();
yi.connect()
.then(function() {
	console.log('connected');
	return yi.downloadFileList("/tmp/fuse_d/DCIM/100MEDIA/");
})
.then(function (fileList) {
	console.log('fileList', fileList);
	return "/tmp/fuse_d/DCIM/100MEDIA/YDXJ0036.JPG";
})
.then(function(filePath) {
	return yi.downloadFile(filePath);
})
.then(function () {
	yi.disconnect();
	console.log('disconnected');
})
.catch(function (err) {
	console.error(err);
});
*/