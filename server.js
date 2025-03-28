import indexPage from "./index.html"
import {$} from "bun"

const servers = {
    nas: {
        label: 'Nas',
        mac: '48:21:0b:3e:19:f0',
        ip: '192.168.1.2',
        status: false,
        loading: false
    },
    widows: {
        label: 'Windows',
        mac: '58:11:22:AE:82:57',
        ip: '192.168.1.20',
        status: false,
        loading: false
    },
}

const server = Bun.serve({
    port: 9878,
    development: false,
    routes: {
        "/": indexPage,
        "/favicon.ico": new Response(await Bun.file("./favicon.ico").bytes(), {headers: {"Content-Type": "image/x-icon",},}),
        "/hosts": {
            async GET() {
                try {
                    for (let key in servers) {
                        servers[key].status = await checkHostStatus(servers[key].ip)
                    }
                    return Response.json(servers)

                } catch (error) {
                    return Response.json({status: 500})
                }
            }
        },
        "/wake": {
            async POST(req) {
                try {
                    let params = await req.json()
                    await wakeOnLan(servers[params.host].mac)
                    let res = await waitForHostOnline((servers[params.host].ip))
                    return Response.json({status: res})
                } catch (error) {
                    return Response.json({status: false})
                }
            }
        },
    },
    fetch() {
        return new Response("Not Found")
    },
})
console.log(`Server running at ${server.url}`)

// wol
async function wakeOnLan(macAddress, ipAddress = "255.255.255.255", port = 9) {
    const macBytes = macAddress.split(/[:-]/).map(x => parseInt(x, 16))
    const packet = new Uint8Array(102)
    packet.fill(0xFF, 0, 6)
    for (let i = 0; i < 16; i++) {
        packet.set(macBytes, 6 + i * 6)
    }
    const socket = await Bun.udpSocket({})
    socket.setBroadcast(true)
    socket.send(packet, port, ipAddress)
    socket.close()
}

async function checkHostStatus(ip) {
    try {
        const result = await Promise.race([
            $`ping -c 1 ${ip}`.quiet(),
            Bun.sleep(200).then(() => {
                return false
            })
        ])
        return result.exitCode === 0 && result.stdout.includes('1 packets received')
    } catch (error) {
        return false
    }
}

async function waitForHostOnline(ip, interval = 1000, maxAttempts = 10) {
    let attempts = 0
    while (attempts < maxAttempts) {
        const isOnline = await checkHostStatus(ip)
        if (isOnline) {
            return true
        }
        attempts++
        await Bun.sleep(interval)
    }
    return false
}