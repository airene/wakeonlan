// server.js
import {serve} from "bun";

// WOL实现函数
async function wakeOnLan(macAddress, ipAddress = "255.255.255.255", port = 9) {
    const macBytes = macAddress.split(/[:-]/).map(x => parseInt(x, 16));

    // 创建WOL magic packet
    const packet = new Uint8Array(102);
    packet.fill(0xFF, 0, 6);
    for (let i = 0; i < 16; i++) {
        packet.set(macBytes, 6 + i * 6);
    }

    // 创建UDP socket并发送数据包
    const socket = await Bun.udpSocket({});
    socket.setBroadcast(true);
    socket.send(packet, port, ipAddress);
    socket.close();
}

// 服务端
serve({
    port: 9878, async fetch(req) {
        const url = new URL(req.url, `http://${req.headers.get("host")}`);
        const favicon = await Bun.file("favicon.ico").arrayBuffer();
        if (req.method === "GET" && url.pathname === "/") {
            // 读取并返回 index.html 文件
            const htmlFile = await Bun.file("index.html").text();
            return new Response(htmlFile, {
                headers: {"Content-Type": "text/html"},
            });
        }
        if (req.method === "GET" && url.pathname === "/favicon.ico") {
            return favicon ? new Response(favicon, {headers: {"Content-Type": "image/x-icon"}}) : new Response("Favicon not found", {status: 404});
        }
        if (req.method === "POST" && url.pathname === "/wake") {
            try {
                let computers = {
                    nas: "48:21:0b:3e:19:f0", win: "58:11:22:AE:82:57"
                }
                let computer = await req.json().then(data => data);
                await wakeOnLan(computers[computer.host]);
                return new Response("Wake signal has sent!", {
                    status: 200,
                });
            } catch (error) {
                return new Response(`Failed to send wake signal: ${error.message}`, {
                    status: 500,
                });
            }
        }

        return new Response("Not Found", {status: 404});
    },
});

console.log("Server running at http://localhost:9878");