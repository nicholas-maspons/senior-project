import nmap
import mysql.connector

conn = mysql.connector.connect(
    host='192.168.0.102',
    user='nicholas',
    password='senior-project',
    database='homelab'
)


cursor = conn.cursor()

cursor.execute("UPDATE devices SET active = 0")
conn.commit()

nm = nmap.PortScanner()
nm.scan(hosts='192.168.0.0/24', arguments='-sn')

for host in nm.all_hosts():
    ip = host
    cursor.execute("""
        INSERT INTO devices (ip, active)
        VALUES (%s, 1)
        ON DUPLICATE KEY UPDATE active = 1
    """, (ip,))
    print(f"Active: {ip}")


conn.commit()
cursor.close()
conn.close()

# print('scan done')