import asyncio
import websockets
import cv2
import numpy as np
import matplotlib.pyplot as plt
import base64
import random
import json

import datetime

from sre_constants import CATEGORY
from tensorflow.keras.optimizers import SGD
import tensorflow as tf
import json
from PIL import Image,ImageDraw,ImageFont
from datetime import datetime
from glob import glob
from tqdm import tqdm
import time

from keras.layers import Dense,Dropout,Conv3D,Input,MaxPool3D,Flatten,Activation
from keras.regularizers import l2
from keras.models import Model

# model_load
os.environ["CUDA_DEVICE_ORDER"]="PCI_BUS_ID"   
os.environ["CUDA_VISIBLE_DEVICES"] = "0"

# 위험도 판별을 위한 머신러닝 모델
def c3d_model():
    input_shape = (112,112,16,3)
    weight_decay = 0.005
    nb_classes = 20

    inputs = Input(input_shape)
    x = Conv3D(64,(3,3,3),strides=(1,1,1),padding='same',
               activation='relu',kernel_regularizer=l2(weight_decay))(inputs)
    x = MaxPool3D((2,2,1),strides=(2,2,1),padding='same')(x)

    x = Conv3D(128,(3,3,3),strides=(1,1,1),padding='same',
               activation='relu',kernel_regularizer=l2(weight_decay))(x)
    x = MaxPool3D((2,2,2),strides=(2,2,2),padding='same')(x)

    x = Conv3D(128,(3,3,3),strides=(1,1,1),padding='same',
               activation='relu',kernel_regularizer=l2(weight_decay))(x)
    x = MaxPool3D((2,2,2),strides=(2,2,2),padding='same')(x)

    x = Conv3D(256,(3,3,3),strides=(1,1,1),padding='same',
               activation='relu',kernel_regularizer=l2(weight_decay))(x)
    x = MaxPool3D((2,2,2),strides=(2,2,2),padding='same')(x)

    x = Conv3D(256, (3, 3, 3), strides=(1, 1, 1), padding='same',
               activation='relu',kernel_regularizer=l2(weight_decay))(x)
    x = MaxPool3D((2, 2, 2), strides=(2, 2, 2), padding='same')(x)

    x = Flatten()(x)
    x = Dense(2048,activation='relu',kernel_regularizer=l2(weight_decay))(x)
    x = Dropout(0.5)(x)
    x = Dense(2048,activation='relu',kernel_regularizer=l2(weight_decay))(x)
    x = Dropout(0.5)(x)
    x = Dense(nb_classes,kernel_regularizer=l2(weight_decay))(x)
    x = Activation('softmax')(x)

    model = Model(inputs, x)
    return model

clips = []

# frame 하나 당 모델 적용 및 다음 상황 예측
def M1(frame):
    model = c3d_model()
    lr = 0.005
    sgd = SGD(lr = lr, momentum=0.9, nesterov=True)
    model.compile(loss='categorical_crossentropy', optimizer=sgd, metrics=['accuracy'])
    model = tf.keras.models.load_model('./input_data/epoch10_temp_weights_c3d.h5')

    width = frame.shape[1]
    height = frame.shape[0]

    global clips
    
    fm=open('./input_data/index.txt', 'r')
    main_names = fm.readlines()
    main_count_list = [0 for i in range(len(main_names))]
    tmp = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    clips.append(cv2.resize(tmp, (171, 128)))
    if len(clips) == 16:
        inputs = np.array(clips).astype(np.float32)
        inputs = np.expand_dims(inputs, axis=0)
        inputs[..., 0] -= 99.9
        inputs[..., 1] -= 92.1
        inputs[..., 2] -= 82.6
        inputs[..., 0] /= 65.8
        inputs[..., 1] /= 62.3
        inputs[..., 2] /= 60.3
        inputs = inputs[:,:,8:120,30:142,:]
        inputs = np.transpose(inputs, (0, 2, 3, 1, 4))
        
        pred_main = model.predict(inputs)
        main_label = np.argmax(pred_main[0])        
        main_count_list[main_label]=main_count_list[main_label]+1
        # main_mode_label = np.argmax(main_count_list)
        # fw.write(main_names[main_label].split(' ')[1].strip()+" prob: %.4f" % pred_main[0][main_label]+'\n')
        clips.pop(0)
        
        # return_value = main_names[main_mode_label].split(' ')[-1].strip()
        # print("------------------", main_mode_label, "------------------")
        label = main_names[main_label].split(' ')[1].strip()+" prob: %.4f" % pred_main[0][main_label]+'\n'
        
        return label


def get_time():
    today = datetime.datetime.today()
    t_year = str(today.year)
    t_month = str(today.month)
    t_day = str(today.day)
    t_hour = str(today.hour)
    t_minute = str(today.minute)

    str_date = t_year + '-' + t_month + '-' + t_day + ' TIME:' + t_hour + ':' + t_minute
    return str_date

cnt = 0

# 이미지 크기 설정
def process_frame(frame_data):
    frame = np.frombuffer(frame_data, dtype=np.uint8).reshape(720, 600, 4)
    frame = frame[:, :, :3]  

    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame = np.array(frame)

    return frame
    # return resized_frame


# 위험도를 임의로 1 ~ 3이라고 설정
# 위험도가 1보다 큰 경우 data라는 객체 형성 후 클라이언트 웹으로 넘겨줌
async def video_stream(websocket, path):
    async for frame_data in websocket:
       # 이미지 frame 크기 맞추기 
        frame = process_frame(frame_data)
        
        # 받아온 frame 마다 모델 처리 과정 적용시키기 --> label (위험 상황 분류 & probability) 받아옴.
        label = M1(frame)

        # label을 분류 시켜서 상황과 확률 추출
        situa = label[0:3]
        pro = label[10:16]

        # 확률에 따라 frame 설정
        # 0.7 이하일 경우 --> 검은 frame 에 SAFE 글자 출력
        if float(pro) <= 0.7:
            danger = 'SAFE'
            frame = np.zeros((720, 600, 3), np.uint8)
        # 0.7 보다 클 경우 --> websocket으로 받아 온 frame 위에 DANGER 글자 출력
        else:
            danger = 'DANGER'
        
        # frame 회전
        frame = cv2.rotate(frame, (cv2.ROTATE_90_COUNTERCLOCKWISE))

        now_date = get_time()
        # Websocket Client UI 전송
        encoded_frame = base64.b64encode(frame).decode('utf-8')
        data = {
            'danger' : danger,
            'frame' : encoded_frame,
            'date' : now_date
        }
        
        await websocket.send(json.dumps(data))
        

# websocket 연결 경로 지정 및 포트 포워딩
start_server = websockets.serve(video_stream, 'localhost', 9997, max_size=10000000)

# Run the WebSocket server in a separate process (you can also use a terminal)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

    