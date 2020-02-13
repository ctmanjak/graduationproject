import requests, json
import Control

def write():

    title = input('Title: ')
    author = input('Author: ')
    category = input('Category: ')
    publisher = input('publisher: ')
    # title, author, category = "How to Kotlin", "차현석", "테스트"
    # data = {"title":title,"author":author,"category":category}
    data = [title, author, category, publisher]
    
    uid = Control.write(",".join(data))

    jsondata = {"title":data[0],"author":data[1],"category":data[2],"publisher":data[3]}
    jsondata['tag_id'] = "".join([f'{a:02X}' for a in uid])
    requests.post("http://121.187.202.41/api/rfid/write", data=jsondata)

if __name__ == "__main__":
    write()