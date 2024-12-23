import fetch from 'node-fetch';
import fs from 'fs/promises';
import log from './utils/logger.js';
import beddu from './utils/banner.js';
import { HttpsProxyAgent } from 'https-proxy-agent';

// The API base URLs
const BASE_URL = 'https://api.hivera.org';
const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// Default configuration
const DEFAULT_CONFIG = {
    minPower: 500,
    useProxy: true,
    retryDelay: 5000,
    requestTimeout: 30000,
    maxThreads: 5,
    timeSleep: 5
};

async function createProxyAgent(proxyUrl) {
    if (!proxyUrl) return null;
    return new HttpsProxyAgent(proxyUrl);
}

async function checkProxyIP(proxy) {
    try {
        const proxyAgent = new HttpsProxyAgent(proxy);
        const response = await fetch("https://api.ipify.org?format=json", { agent: proxyAgent });
        if (response.ok) {
            const data = await response.json();
            return data.ip;
        }
        throw new Error(`Cannot check proxy IP. Status code: ${response.status}`);
    } catch (error) {
        throw new Error(`Error checking proxy IP: ${error.message}`);
    }
}

async function fetchAuthData(userData, agent) {
    try {
        const response = await fetch(`${BASE_URL}/auth?auth_data=${encodeURIComponent(userData)}`, {
            headers: headers,
            agent: agent
        });
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        log.error('Error fetching auth data:', error);
        return null;
    }
}

async function fetchInfoData(userData, agent) {
    try {
        const response = await fetch(`${BASE_URL}/engine/info?auth_data=${encodeURIComponent(userData)}`, {
            headers: headers,
            agent: agent
        });
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        log.error('Error fetching info data:', error);
        return null;
    }
}

async function fetchPowerData(userData, agent) {
    try {
        const response = await fetch(`${BASE_URL}/users/powers?auth_data=${encodeURIComponent(userData)}`, {
            headers: headers,
            agent: agent
        });
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        log.error('Error fetching power data:', error);
        return null;
    }
}

function generatePayload() {
    const fromDate = Date.now();
    const values = [90, 94, 95, 97, 99];
    const qualityConnection = values[Math.floor(Math.random() * values.length)];
    return {
        from_date: fromDate,
        quality_connection: qualityConnection,
        times: 1
    };
}

async function contribute(userData, times, agent) {
    try {
        const payload = generatePayload();
        const response = await fetch(`${BASE_URL}/v2/engine/contribute?auth_data=${encodeURIComponent(userData)}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                ...payload,
                times
            }),
            agent: agent
        });

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        log.error('Error in contribute:', error);
        return null;
    }
}

async function processUser(userData, proxy, accountIndex = 0) {
    let times = 1;
    let username = "Unknown";
    let initPower = 0;
    let proxyIp = "Unknown IP";

    try {
        const agent = await createProxyAgent(proxy);
        if (proxy) {
            proxyIp = await checkProxyIP(proxy);
            log.info(`Using proxy: ${proxyIp}`);
        }

        const profile = await fetchAuthData(userData, agent);
        username = profile?.result?.username || "Unknown";

        const powerData = await fetchPowerData(userData, agent);
        let currhivera = powerData?.result?.HIVERA || 0;
        let power = powerData?.result?.POWER || 0;
        initPower = power;
        let powerCapacity = powerData?.result?.POWER_CAPACITY || 0;

        log.info(`[Account ${accountIndex + 1}][${proxyIp}] Username: ${username} | Hivera: ${currhivera.toFixed(2)} | Power: ${power} | Power Capacity: ${powerCapacity}`);

        // Start mining
        while (power > 500) {
            log.info(`[Account ${accountIndex + 1}][${proxyIp}] | Hivera: ${currhivera.toFixed(2)} | Power: ${power}| Ping successful!`);
            power -= 500;
            times++;
            
            if (times === 10) {
                const contributeData = await contribute(userData, times, agent);
                if (contributeData?.result) {
                    const { HIVERA, POWER } = contributeData.result.profile;
                    power = POWER || 0;
                    log.info(`Mining successfully for user: ${username} |[${proxyIp}]`);
                    log.info(`[Account ${accountIndex + 1}][${proxyIp}] | Hivera: ${HIVERA.toFixed(2)} (+${(HIVERA - currhivera).toFixed(2)}) | Power: ${power}`);
                    currhivera = HIVERA;
                    times = 1;
                } else {
                    return log.error(`[Account ${username}][${proxyIp}] Error contribute...`);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 30 * 1000));
        }

        if (initPower > 500) {
            const newContributeData = await contribute(userData, times, agent);
            if (newContributeData?.result) {
                const { HIVERA: newHivera } = newContributeData.result.profile;
                log.warn(`User ${username} does not have enough power to mine | New Balance: ${newHivera.toFixed(2)} (+${(newHivera - currhivera).toFixed(2)}) ...Skipping`);
            }
        } else {
            log.warn(`User ${username} does not have enough power to mine...Skipping`);
        }
    } catch (error) {
        log.error(`[Account ${accountIndex + 1}] Error processing user ${username} with proxy ${proxyIp}:`, error);
    }
}

async function readUserFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const userArray = data.split('\n').map(line => line.trim()).filter(line => line);
        if (userArray.length === 0) {
            log.warn('No users found in the file.');
        }
        return userArray;
    } catch (error) {
        log.error('Error reading file:', error);
        return [];
    }
}

async function readProxyFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const proxyArray = data.split('\n').map(line => line.trim()).filter(line => line);
        if (proxyArray.length === 0) {
            log.warn('No proxies found in the file.');
        }
        return proxyArray;
    } catch (error) {
        log.error('Error reading proxy file:', error);
        return [];
    }
}

async function main() {
    log.info(beddu);
    
    // Read configuration
    let config = DEFAULT_CONFIG;
    try {
        const configData = await fs.readFile('config.json', 'utf-8');
        config = { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
    } catch (error) {
        log.warn('Config file not found, using default configuration');
    }

    // Read user data
    const userDatas = await readUserFile('users.txt');
    if (userDatas.length === 0) {
        log.error('No user data found in the file.');
        process.exit(0);
    }

    // Read proxy list if enabled
    let proxyList = [];
    if (config.useProxy) {
        proxyList = await readProxyFile('proxies.txt');
        if (proxyList.length === 0) {
            log.warn('No proxies found in the file. Proceeding without proxies.');
        }
    }

    let currentIndex = 0;
    while (true) {
        log.info('Starting processing for all users...');
        
        while (currentIndex < userDatas.length) {
            const batchSize = Math.min(config.maxThreads, userDatas.length - currentIndex);
            const promises = [];

            for (let i = 0; i < batchSize; i++) {
                const proxy = proxyList.length > 0 ? proxyList[currentIndex % proxyList.length] : null;
                promises.push(processUser(userDatas[currentIndex], proxy, currentIndex));
                currentIndex++;
            }

            await Promise.all(promises);

            if (currentIndex < userDatas.length) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        currentIndex = 0;
        log.info(`All users processed. Restarting the loop after ${config.timeSleep} minutes...`);
        await new Promise(resolve => setTimeout(resolve, config.timeSleep * 60 * 1000));
    }
}

// Run
main().catch(error => {
    log.error('An unexpected error occurred:', error);
    process.exit(1);
});
