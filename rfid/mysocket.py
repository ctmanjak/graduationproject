import requests, json
import Control
import socketio
import time
import os
import threading
from time import sleep

lock = True
timeout_status = False

def getserial():
    cpuserial = "0000000000000000"
    try:
        with open('/proc/cpuinfo', 'r') as f:
            for line in f:
                if line[0:6]=='Serial':
                    cpuserial = line[10:26]
            f.close()
    except:
        cpuserial = "ERROR"
    return cpuserial

def register(category_name, pi_serial):
    url = "http://121.187.202.41/api/rfid/register"
    data = {
        "pi_serial":pi_serial,
        "category_name":category_name,
    }
    requests.post(url, data=data)

def timeout(wait_time):
    start_time = time.time()
    current_time = time.time()
    while current_time - start_time < wait_time:
        current_time = time.time()
        if timeout_status: break
    else:
        os._exit(1)

if __name__ == "__main__":
    serial = getserial()

    # register("테스트", serial)
    s = s = socketio.Client()

    s.connect("http://121.187.202.41")

    s.emit("init", serial)

    @s.event
    def init():
        global lock
        lock = False
        print("connected")

    @s.event
    def read(data):
        global lock, timeout_status
        if not lock:
            lock = True
            _read()
            if timeout_status:
                s.emit("returnread", serial)
                lock = False

    @s.event
    def alreadycon():
        # s.emit("alreadycon")
        s.disconnect()
        print("already connected")
        os._exit(1)

    @s.event
    def ping():
        s.emit("pong", serial)

    def _read():
        global timeout_status
        t = threading.Thread(target=timeout, args=(10,))
        t.start()
        readdata = Control.read()
        timeout_status = True
        data = {
            'pi_serial': serial,
            'id_list': ["".join([f"{c:02X}" for c in a]) for a in [b.aUid for b in readdata.simpleTagInfo[:readdata.bTotalTagsFound]]],
        }
        requests.post("http://121.187.202.41/api/rfid/updatecategory", data=data)

        # return readdata.bTotalTagsFound

    while True:
        if not lock:
            _read()

        sleep(1800)