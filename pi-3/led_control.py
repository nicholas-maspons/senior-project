import time
import random
import mysql.connector
from rpi_ws281x import PixelStrip, Color

LED_COUNT = 50
LED_PIN = 18
LED_FREQ_HZ = 800000
LED_DMA = 10
LED_BRIGHTNESS = 52
LED_INVERT = False
LED_CHANNEL = 0

# GRB, not RGB
COLOR_MAP = {
    "red":    Color(0, 255, 0),
    "green":  Color(255, 0, 0),
    "blue":   Color(0, 0, 255),
    "cyan":   Color(255, 0, 255),
    "pink":   Color(20, 255, 147),
    "purple": Color(0, 128, 128),
}
DEFAULT_COLOR = Color(0, 255, 0)


FIXED_IP_MAP = {
    "192.168.0.1": {"index": 49, "color": Color(255, 255, 0)},
    "192.168.0.101": {"index": 11, "color": Color(255, 255, 255)},
    "192.168.0.102": {"index": 25, "color": Color(255, 255, 255)},
    "192.168.0.103": {"index": 37, "color": Color(255, 255, 255)},
}
FIXED_INDICES = {v["index"] for v in FIXED_IP_MAP.values()}
RESERVED = {0, 1}

VISITOR_POOL = [i for i in range(LED_COUNT) if i % 2 != 0 and i not in FIXED_INDICES and i not in RESERVED]
random.shuffle(VISITOR_POOL)

strip = PixelStrip(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_BRIGHTNESS, LED_CHANNEL)
strip.begin()

# its fine to show this stuff now
def get_db():
    # .102 since this was pi2. Pi1 (web server) ended in .101, and Pi3 ended in .103.
    return mysql.connector.connect(
        host='192.168.0.102', 
        user='nicholas',
        password='senior-project',
        database='homelab'
    )

def get_active_devices():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT ip, color FROM devices WHERE active = 1")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return {row[0]: row[1] for row in rows}



def get_latest_message_id():

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(id) FROM messages")
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row[0] if row[0] else 0

prev_state = {}

def render_normal(active_devices, assigned):
    global prev_state
    new_state = {}
    for ip, data in FIXED_IP_MAP.items():
        new_state[data["index"]] = data["color"]
    for ip, idx in assigned.items():
        if ip in active_devices:
            color_name = active_devices.get(ip)
            color = COLOR_MAP.get(color_name, DEFAULT_COLOR)
            new_state[idx] = color
    all_indices = set(prev_state.keys()) | set(new_state.keys())
    for i in all_indices:
        old = prev_state.get(i, Color(0, 0, 0))
        new = new_state.get(i, Color(0, 0, 0))
        if old != new:
            strip.setPixelColor(i, new)
    strip.show()
    prev_state = new_state

def pulse_all(active_devices, assigned):
    for b in list(range(52, 200, 10)) + list(range(200, 52, -10)):
        strip.setBrightness(b)
        render_normal(active_devices, assigned)
        time.sleep(0.02)
    strip.setBrightness(52)
    render_normal(active_devices, assigned)

assigned = {}
last_message_id = get_latest_message_id()

while True:
    try:
        active_devices = get_active_devices()
        active_ips = list(active_devices.keys())
        for ip in active_ips:
            if ip not in FIXED_IP_MAP and ip not in assigned:
                if VISITOR_POOL:
                    idx = VISITOR_POOL.pop(random.randint(0, len(VISITOR_POOL) - 1))
                    assigned[ip] = idx
        latest_id = get_latest_message_id()
        if latest_id > last_message_id:
            last_message_id = latest_id
            pulse_all(active_devices, assigned)
        else:
            render_normal(active_devices, assigned)
    except Exception as e:
        print(f"Error: {e}")

    time.sleep(0.7)


