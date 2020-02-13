import requests, json
import Control
from time import sleep

if __name__ == "__main__":
    while True:
        readdata = Control.read()

        # print(f"Detected Tag{'s' if readdata.bTotalTagsFound > 1 else ''}: {readdata.bTotalTagsFound}")
        # for b in range(readdata.bTotalTagsFound):
        #     print(' '.join([f'{a:02X}' for a in readdata.simpleTagInfo[b].aUid]))

        sleep(1)