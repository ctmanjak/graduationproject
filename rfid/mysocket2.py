import socketio
import requests
import Control

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

def register(category):
    url = "http://121.187.202.41/api/rfid/register"
    data = {
        "pi_serial":"DONTHAVEPISERIAL",
        "category_name":category,
    }
    requests.post(url, data=data)

if __name__ == "__main__":
    register("NOTFOUND")
    # s = socketio.Client()

    # s.connect("http://121.187.202.41/")

    # serial = "1234"
    # s.emit("init", serial)

    # @s.event
    # def message(data):
    #     Control.read()

    # @s.event
    # def alreadycon():
    #     s.emit("alreadycon")
    #     s.disconnect()
    #     print("already connected")
