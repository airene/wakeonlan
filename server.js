// server.js
import {serve} from "bun";
import {createSocket} from "dgram";

// WOL实现函数
function wakeOnLan(macAddress, ipAddress = "255.255.255.255", port = 9) {
    const macBytes = macAddress.split(/[:-]/).map(x => parseInt(x, 16));

    // 创建WOL magic packet
    const packet = new Uint8Array(102);
    packet.fill(0xFF, 0, 6);
    for (let i = 0; i < 16; i++) {
        packet.set(macBytes, 6 + i * 6);
    }

    // 创建UDP socket并发送数据包
    const socket = createSocket("udp4");

    socket.once('listening', function() {
        socket.setBroadcast(true)
    });
    socket.send(packet, 0, packet.length, port, ipAddress, (err) => {
        if (err) {
            console.error("UDP send error:", err);
        }
        socket.close();
    });
}

// 服务端
serve({
    port: 3000,
    async fetch(req) {
        if (req.method === "GET" && req.url.endsWith("/")) {
            // 读取并返回 index.html 文件
            const htmlFile = await Bun.file("index.html").text();
            return new Response(htmlFile, {
                headers: {"Content-Type": "text/html"},
            });
        }

        if (req.method === "POST" && req.url.endsWith("/wake")) {
            try {
                const targetMac = "48:21:0b:3e:19:f0"; // 替换为目标MAC地址
                wakeOnLan(targetMac);
                return new Response("Wake signal sent successfully", {
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

console.log("Server running at http://localhost:3000");