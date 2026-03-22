import { useState, useEffect, useRef } from "react";

const API = "http://192.168.0.101:3000";

const PI_LABELS = {
    "192.168.0.101": "Pi 1",
    "192.168.0.102": "Pi 2",
    "192.168.0.103": "Pi 3",
    "192.168.0.1": "Router"
};

const ROUTER_IP = "192.168.0.1";

function getLabel(device) {
    return PI_LABELS[device.ip] || device.name || device.ip;
}

function useRandomPositions(ids) {
    const positions = useRef({});
    ids.forEach(id => {
        if (!positions.current[id]) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = 120 + Math.random() * 80;
            positions.current[id] = {
                x: 250 + Math.cos(angle) * radius,
                y: 250 + Math.sin(angle) * radius
            };
        }
    });
    Object.keys(positions.current).forEach(id => {
        if (!ids.includes(id)) delete positions.current[id];
    });
    return positions.current;
}

export default function App() {
    const [devices, setDevices] = useState([]);
    const [total, setTotal] = useState(0);
    const [name, setName] = useState("");
    const [myIp, setMyIp] = useState("");
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        async function fetchMyIp() {
            try {
                const res = await fetch(`${API}/api/myip`);
                const data = await res.json();
                setMyIp(data.ip);
            } catch (e) {}
        }
        fetchMyIp();
    }, []);

    useEffect(() => {
        async function fetchData() {
            try {
                const [devRes, countRes] = await Promise.all([
                    fetch(`${API}/api/devices`),
                    fetch(`${API}/api/count`)
                ]);
                const devData = await devRes.json();
                const countData = await countRes.json();
                setDevices(devData);
                setTotal(countData.total);
            } catch (e) {}
        }
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const activeDevices = devices.filter(d => d.active === 1 && d.ip !== ROUTER_IP);
    const positions = useRandomPositions(activeDevices.map(d => d.ip));

    async function handleCheckin() {
        if (!name.trim()) return;
        await fetch(`${API}/api/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });
        setSubmitted(true);
    }

    const myDevice = devices.find(d => d.ip === myIp);
    const showCheckin = myDevice && !myDevice.name && !submitted;

    return (
        <div style={{ fontFamily: "sans-serif", textAlign: "center", padding: "20px" }}>
            <h1>Homelab Network</h1>
            <p>All-time visitors: {total}</p>

            {showCheckin && (
                <div style={{ marginBottom: "20px" }}>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Enter your name"
                        style={{ padding: "8px", marginRight: "8px" }}
                    />
                    <button onClick={handleCheckin}>Check In</button>
                </div>
            )}

            <svg width="500" height="500" style={{ border: "1px solid #ccc", borderRadius: "8px" }}>
                {activeDevices.map(d => {
                    const pos = positions[d.ip];
                    if (!pos) return null;
                    return (
                        <line key={d.ip}
                            x1={250} y1={250}
                            x2={pos.x} y2={pos.y}
                            stroke="#aaa" strokeWidth="1.5"
                        />
                    );
                })}
                <circle cx={250} cy={250} r={40} fill="#4a90e2" />
                <text x={250} y={255} textAnchor="middle" fill="white" fontSize="13">Router</text>
                {activeDevices.map(d => {
                    const pos = positions[d.ip];
                    if (!pos) return null;
                    return (
                        <g key={d.ip}>
                            <circle cx={pos.x} cy={pos.y} r={25} fill="#e27a4a" />
                            <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize="11">
                                {getLabel(d)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}