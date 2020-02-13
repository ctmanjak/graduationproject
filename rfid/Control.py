import sys
import ndef
from time import sleep
from ctypes import *

ISO15693_DEVICE_LIMIT = 4
NDEF_MAX_LENGTH = 308

class simpleTagInfo(Structure):
    _fields_ = [
        ("aUid", c_uint8 * 0x08),
        ("aNdefMessage", c_uint8 * NDEF_MAX_LENGTH),
    ]

class returnData(Structure):
    _fields_ = [
        ("bTotalTagsFound", c_uint8),
        ("simpleTagInfo", simpleTagInfo * ISO15693_DEVICE_LIMIT),
    ]

reader = CDLL("./libiso15693.so")
reader.ReadTag.restype = returnData
reader.ReadTag.argtypes = [c_int]

reader.WriteTag.restype = returnData
reader.WriteTag.argtypes = [c_int, POINTER(c_uint8), c_uint16]

reader.init()

def read():
    data = reader.ReadTag(500)

    print(f"Detected Tag{'s' if data.bTotalTagsFound > 1 else ''}: {data.bTotalTagsFound}")
    for b in range(data.bTotalTagsFound):
        print(" ".join([f'{a:02X}' for a in data.simpleTagInfo[b].aUid]))
        # ndefMessage = "".join([f'{a:02X}' for a in data.simpleTagInfo[b].aNdefMessage])
        # try:
        #     message = list(ndef.message_decoder(bytearray.fromhex(ndefMessage)))
        #     for m in message:
        #         if hasattr(m, "text"): print(m.text)
        #         else: print("NDEF content is NULL")
        # except ndef.DecodeError:
        #     print("No NDEF content detected")
    return data

def write(writedata):
    payload = writedata
    payload = payload[:NDEF_MAX_LENGTH-10] if len(payload) >= NDEF_MAX_LENGTH-10 else payload
    bPayload = list(payload.encode("utf-8"))
    header = [0xD1] if 0x03+len(bPayload) <= 0xFF else [0xC1]
    records = header + [0x01] + (list(bytearray.fromhex(f"{0x03+len(bPayload):08X}")) if header[0] == 0xC1 else [0x03+len(bPayload)]) + [0x54, 0x02, 0x6b, 0x72]
    writemessage = records + list(payload.encode("utf-8"))
    arr = (c_uint8 * len(writemessage))(*writemessage)

    data = reader.WriteTag(1, arr, len(writemessage))

    print(" ".join([f'{a:02X}' for a in data.simpleTagInfo[0].aUid]))
    ndefMessage = "".join([f'{a:02X}' for a in data.simpleTagInfo[0].aNdefMessage])
    try:
        message = list(ndef.message_decoder(bytearray.fromhex(ndefMessage)))
        for m in message:
            if hasattr(m, "text"): print(m.text)
            else: print("NDEF content is NULL")
    except ndef.DecodeError:
        print("No NDEF content detected")

    return data.simpleTagInfo[0].aUid

if __name__ == "__main__":
    # while True:
    read()

        # sleep(1)
    # write("a"*255)