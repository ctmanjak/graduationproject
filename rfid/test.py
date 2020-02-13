import requests
import json
import time

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

url = "http://121.187.202.41/api/rfid/getcategories"

data = {
    # "category_name":"테스트"
}

# for i in range(100):
response = requests.post(url, data=data)
print(response.content.decode("utf-8"))
response = requests.post("http://121.187.202.41/api/rfid/getinvalidbookinfo")
print(response.content.decode("utf-8"))
print(response.status_code)

# a = json.loads(response.content.decode("utf-8"))

# for b in a:
#     print(b)

# content = [0xED, 0x85, 0x8c, 0xec, 0x8a, 0xa4, 0xed, 0x8a, 0xb8]

# text = bytes(content).decode("utf-8")

# print(len(list(text.encode("utf-8"))))