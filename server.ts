import indexPage from "./index.html";
const server = Bun.serve({
        port: 9878,
        //development: true,
        routes: {
            "/": indexPage,
            "/favicon.ico": new Response(await Bun.file("./favicon.ico").bytes(), {
                headers: {
                    "Content-Type": "image/x-icon",
                },
            }),
            "/wake": {
                async POST(req) {
                    try {
                        let computers = {
                            nas: "48:21:0b:3e:19:f0",
                            win: "58:11:22:AE:82:57"
                        };
                        let computer = await req.json();
                        await wakeOnLan(computers[computer.host]);
                        return new Response("Wake signal has sent!", {
                            status: 200
                        });
                    } catch (error) {
                        return new Response(`Failed to send wake signal: ${error.message}`, {
                            status: 500
                        });
                    }
                }
            }
        },
        fetch(request) {
            return new Response("Not Found");
        },
    })
;
console.log(`Server running at ${server.url}`);

// wol
async function wakeOnLan(macAddress, ipAddress = "255.255.255.255", port = 9) {
    const macBytes = macAddress.split(/[:-]/).map(x => parseInt(x, 16));

    const packet = new Uint8Array(102);
    packet.fill(0xFF, 0, 6);
    for (let i = 0; i < 16; i++) {
        packet.set(macBytes, 6 + i * 6);
    }

    const socket = await Bun.udpSocket({});
    socket.setBroadcast(true);
    socket.send(packet, port, ipAddress);
    socket.close();
}
