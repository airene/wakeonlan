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

async function waitForHostOnline(ip, interval = 1000, maxAttempts = 5) {
    let attempts = 0;
    console.log(`开始检测 ${ip} 是否在线...`);

    while (attempts < maxAttempts) {
        const isOnline = await checkHostStatus(ip);
        if (isOnline) {
            console.log(`主机 ${ip} 已在线！`);
            return true;
        }
        attempts++;
        console.log(`尝试 ${attempts}/${maxAttempts} - 主机仍未在线`);
        // 等待指定的时间间隔
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    console.log(`达到最大尝试次数，主机 ${ip} 仍未在线`);
    return false;
}
let res = await waitForHostOnline('192.168.1.2')
console.log(res,"asdf");