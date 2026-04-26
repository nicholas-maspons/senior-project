import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import routerImg from "./assets/router.png";

const API = "http://192.168.0.101:3000";

const PI_IPS = ["192.168.0.101", "192.168.0.102", "192.168.0.103"];
const ROUTER_IP = "192.168.0.1";

const PI_LABELS = {
    "192.168.0.101": "Pi 1",
    "192.168.0.102": "Pi 2",
    "192.168.0.103": "Pi 3",
    "192.168.0.1": "Router"
};

const COLOR_OPTIONS = ["red", "green", "blue", "cyan", "pink", "purple"];

const COLOR_HEX = {
    red:    "#ff0000",
    green:  "#00ff00",
    blue:   "#0000ff",
    cyan:   "#00ffff",
    pink:   "#ff1493",
    purple: "#800080",
};

function getLabel(device) {
    return PI_LABELS[device.ip] || device.name || device.ip;
}

function getBubbleColor(device) {
    if (PI_IPS.includes(device.ip)) return "#ffffff";
    if (device.color && COLOR_HEX[device.color]) return COLOR_HEX[device.color];
    return "#ff0000";
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

function MainPage() {
    const [devices, setDevices] = useState([]);
    const [total, setTotal] = useState(0);
    const [name, setName] = useState("");
    const [color, setColor] = useState("red");
    const [myIp, setMyIp] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

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

    const myDevice = devices.find(d => d.ip === myIp);
    const showCheckin = myDevice && !myDevice.name && !submitted;

    async function handleCheckin() {
        if (!name.trim()) return;
        await fetch(`${API}/api/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, color })
        });
        setSubmitted(true);
    }

    async function handleSendMessage() {
        if (!message.trim()) return;
        const senderName = myDevice?.name || myIp;
        await fetch(`${API}/api/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: senderName, message })
        });
        setMessage("");
    }

    return (
        <div className="main-container">
            <h1 className="title">In The Network</h1>
            <p className="visitor-count">All-time visitors: {total}</p>

            {showCheckin && (
                <div className="checkin-container">
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="checkin-input"
                    />
                    <select
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        className="checkin-select"
                    >
                        {COLOR_OPTIONS.map(c => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                    </select>
                    <button onClick={handleCheckin} className="checkin-button">
                        Check In
                    </button>
                </div>
            )}

            <svg width="500" height="500" className="network-svg">
                {activeDevices.map(d => {
                    const pos = positions[d.ip];
                    if (!pos) return null;
                    return (
                        <line key={d.ip}
                            x1={250} y1={250}
                            x2={pos.x} y2={pos.y}
                            stroke="white" strokeWidth="1.5"
                        />
                    );
                })}
                <image href={routerImg} x={210} y={210} width={80} height={80} />
                {activeDevices.map(d => {
                    const pos = positions[d.ip];
                    if (!pos) return null;
                    return (
                        <g key={d.ip}>
                            <circle cx={pos.x} cy={pos.y} r={31} fill={getBubbleColor(d)} />
                            <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="black" fontSize="11">
                                {getLabel(d)}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {!showCheckin && (
                <div className="message-input-container">
                    <input
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Send a message..."
                        className="checkin-input"
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button onClick={handleSendMessage} className="checkin-button">
                        Send
                    </button>
                </div>
            )}

            <button onClick={() => navigate("/messages")} className="messages-button">
                View Messages
            </button>
        </div>
    );
}

function MessagesPage() {
    const [messages, setMessages] = useState([]);
    const bottomRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchMessages() {
            try {
                const res = await fetch(`${API}/api/messages`);
                const data = await res.json();
                setMessages(data);
            } catch (e) {}
        }
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <div className="messages-container">
            <button onClick={() => navigate("/")} className="back-button">
                ← Back
            </button>
            <div className="messages-list">
                {messages.map(msg => (
                    <div key={msg.id} className="message-row">
                        <span className="message-name">
                            {msg.name || msg.ip}
                        </span>
                        <span className="message-text">{msg.message}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/messages" element={<MessagesPage />} />
        </Routes>
    );
}