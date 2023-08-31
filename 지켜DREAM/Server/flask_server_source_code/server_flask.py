import asyncio
import websockets
import cv2
import numpy as np
import matplotlib.pyplot as plt
import base64
import random
from time import sleep

# flask, flask websocket, git clone, sock 등 다 설치해둘 것

import json
from io import BytesIO
from PIL import Image

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

import requests
from gtts import gTTS
import playsound


# data_dict_list
data_dict_list = []

# data dictionary
data_dict = {
    'danger' : 0,
    'frame' : 0,
    'date' : 0
}

def speak(text):
    tts = gTTS(text = text, lang='ko')
    filename = 'voice.mp3'
    tts.save(filename)
    playsound.playsound(filename)

def DB_data_save():
    data_index_date = data_dict_list[0]['date']
    print('시간 : ', data_index_date)
    print('\n', '저장되었습니다')

def data_dict_save(data_dict):
    if len(data_dict_list) >= 20:
        DB_data_save()
        data_dict_list.clear()
    
    # 프레임 호출하여 위험도에 따라 띄울지 말지 결정
    data_dict_frame = data_dict['frame']
    if data_dict['danger'] == 1:
        if len(data_dict_list) > 0:
            print('리스트 초기화데스')
            DB_data_save()
            data_dict_list.clear()

        # data_dict_frame = np.zeros((224, 224), np.uint8)
        # sleep(0.04)
    else:
        if len(data_dict_list) == 0:
            speak('공습경보')
        data_dict_list.append(data_dict)


    return data_dict_frame


def data_dict_update(data):

    if len(data) == 4:
        data_dict['danger'] = data[3]
    elif len(data) > 4 and len(data) < 30:
        date_string = [chr(i) for i in data]
        date_string = ''.join(date_string)

        data_dict['date'] = date_string

        streaming_frame = data_dict_save(data_dict)
        return streaming_frame
    else:
        # to numpy image
        data = data.reshape(224, 224, 3)
        data = np.array(data)

        data = cv2.cvtColor(data, cv2.COLOR_BGR2RGB)
        data_dict['frame'] = data
        
def image_generator(frame):
    ret, buffer = cv2.imencode('.jpg', frame)
    frame = buffer.tobytes()

    yield (b'--frame\r\n'b' Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

# socketio -> json 객체가 디폴트..
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins = '*')

@socketio.on('connect')
def isConnected():
    print('connect!!!!')

@socketio.on('message')
def message_handle(data):
    data = np.frombuffer(data, dtype = np.uint8)
    
    data_dict_frame = data_dict_update(data)

    if data_dict_frame is not None:
        image_data_encoded = base64.b64encode(data_dict_frame).decode('utf-8')
        
        socketio.emit('frame_message', image_data_encoded)



@app.route('/')
def hello():
    return {"hello" : "world"}

# 로컬 세팅 -> 
if __name__ == '__main__':
    socketio.run(app, host = '0.0.0.0', port = 5111, debug = True)