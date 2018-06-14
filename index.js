// 起動パラメータ node index.js {ポート番号} {IPアドレス}

/*
通信サーバ

通信フォーマット
１バイト目　0xFF（デリミタ）
２バイト目　id（宛先ID）
３バイト目　値(0-180)
　　　　　　キープアライブ(200)
*/

var net = require('net');
global.socks = new Array();     // 接続しているソケット
var HOST = process.argv[3] || getIPAddresses()[0];
var PORT = process.argv[2] || 443;


function getIPAddresses() {
    var ipAddresses = [];
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                ipAddresses.push(alias.address);
            }
        }
    }
    return ipAddresses;
}

function write(sock, data) {
    for (var i = global.socks.length; i--; ) {
        //if (global.socks[i] != sock) {     // 自分以外に送信、エコーバックは受信したクライアントが行う
            global.socks[i].write(data);
        //}
    }
}

function errorsock(sock) {
    console.log
    for (var i = global.socks.length; i--; ) {
        if (global.socks[i] === sock) {  // 該当のソケットを削除
            global.socks.splice(i, 1);
        }
    }
}

server = net.createServer(function(sock) {
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    global.socks.push(sock)

    sock.on('connect', function() {
        console.log('EVENT connect');
    });

    sock.on('data', function(data) {             // １バイトづつ来るとは限らない
        if (data.length >= 3) {    // ３バイト以上のデータのみ使用
            var p = -1;
            for (var i = data.length - 2; i--; ) {
//                console.log(data[i]);
                if (data[i] == 255) {
                    p = i;
                }
            }
            if (p >= 0) {         // 正しいデータあり
                console.log('id:' + data[p+1] + ' val:' + data[p+2] + ' len:' + data.length);
                d = new Buffer(3);
                d[0] = 255;
                d[1] = data[p+1];
                d[2] = data[p+2];
                if (data[p+2] == 200) {    // キープアライブなら送信側のみに返答
                    sock.write(d);
                } else {                   // そうでない場合みんなに送信
                    write(sock, d);
                }
            } else {
                console.log('not found separater. data len:' + data.length);
            }
        } else {
            console.log('illegal data len:' + data.length);
        }
    });

    sock.on('end', function() {
        console.log('EVENT end');
    });

    sock.on('timeout', function() {
        console.log('EVENT timeout');
    });

    sock.on('drain', function() {
        console.log('EVENT drain');
    });

    sock.on('error', function(error) {
        console.log('EVENT error:' + error);
        errorsock(sock);
    });

    sock.on('close', function(had_error) {
        console.log('EVENT close:' + had_error);
    });
})
server.listen(PORT, HOST);
console.log('Server listening on ' + HOST +':'+ PORT);

/*
httpサーバ
*/
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.post('/', function(req, res) {
    // リクエストボディを出力
//    console.log(req.body);
    // パラメータ名、nameを出力
    device.send(req.body.id, parseInt(req.body.val));
    send(req.body.id, parseInt(req.body.val));

    res.send('POST request to the homepage');
})

app.post('/line', function(req, res) {
    // リクエストボディを出力
    console.log(req.body);
    // パラメータ名、nameを出力
    console.log(req.body.msg);
    var headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.LineToken
    }
    var body = {
        'to': config.LineUserId,
        'messages': [{
            'type': 'text',
            'text': req.body.msg
        }]
    }
    var url = 'https://api.line.me/v2/bot/message/push';
    request({
        url: url,
        method: 'POST',
        headers: headers,
        body: body,
        json: true
    });

    res.send('POST request to the homepage');
})
 
app.listen(80);

