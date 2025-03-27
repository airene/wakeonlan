import indexPage from "./index.html";
import {$} from "bun"

const servers = {
    nas:
        {
            id: 'Nas',
            mac:
                '48:21:0b:3e:19:f0',
            ip:
                '192.168.1.2',
            status: false
        }
    ,
    widows:
        {
            id: 'Windows',
            mac:
                '58:11:22:AE:82:57',
            ip:
                '192.168.1.20',
            status: false
        }
    ,
}
const server = Bun.serve({
        port: 9878,
        development: false,
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

                        let params = await req.json();
                        await wakeOnLan(servers[params.host].mac);
                        let res = await checkHostStatus((servers[params.host].ip), 2000)
                        return new Response(JSON.stringify({status: res}), {
                            headers: {
                                "Content-Type": "application/json" // 设置响应头为 JSON 格式
                            }
                        });
                    } catch (error) {
                        return new Response(JSON.stringify({status: false}), {
                            headers: {
                                "Content-Type": "application/json" // 设置响应头为 JSON 格式
                            }
                        });
                    }
                }
            },
            "/hosts": {
                async GET() {
                    try {
                        for (let key in servers) {
                            servers[key].status = await checkHostStatus(servers[key].ip, 500)
                        }
                        return new Response(JSON.stringify(servers), {
                            headers: {
                                "Content-Type": "application/json" // 设置响应头为 JSON 格式
                            }
                        });
                    } catch (error) {
                        return new Response(`Failed to check status: ${error.message}`, {
                            status: 500
                        });
                    }
                }
            }
        },
        fetch() {
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

async function checkHostStatus(ip, timeout) {
    try {
        const result = await Promise.race([
            $`ping -c 1 ${ip}`.quiet(),
            Bun.sleep(timeout).then(() => {
                throw new Error('Timeout')
            })
        ]);
        return result.exitCode === 0 && result.stdout.includes('1 packets received');
    } catch (error) {
        return false;
    }
}