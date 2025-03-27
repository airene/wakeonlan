import {$} from "bun"

async function checkHostStatus(ip) {
    try {
        const result = await Promise.race([
            $`ping -c 1 ${ip}`.quiet(),
            Bun.sleep(1000).then(() => {
                throw new Error('Timeout')
            })
        ]);
        return result.exitCode === 0 && result.stdout.includes('1 packets received');
    } catch (error) {
        return false;
    }
}
let status = await checkHostStatus('192.168.1.2')
console.log(status,"status");