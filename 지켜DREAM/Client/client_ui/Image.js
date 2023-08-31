// html 태그 불러오기
const videoElement  = document.getElementById('cam');
const canvasElement = document.getElementById('cam_output');

// websocket 연결
const webSocket_client = new WebSocket('ws://localhost:9997');
const webSocket_server = new io.connect('http://localhost:5111',{
    cors:{origin : '*'}
});
let context = canvasElement.getContext("2d");

//전역 변수 설정
height = 900;
width  = 720;
 
FPS = 15;

// 웹페이지 캠 스트리밍
async function getVideoStream() {
    try {
        //navigator의 mediaDevices 함수 사용해서 연결된 캠으로부터 비디오 stream 받아오기
        //html의 video 태그에 stream 보내기
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
    } catch (error) {
        console.error('Error accessing webcam:', error);
    }
}

// 임베디드 장치 내에서 이미지 캡쳐 후 상황 분류를 위해 클라이언트 python 코드로 전송
async function captureFrame() {
    const videoElement = document.getElementById('cam');
    const canvasElement = document.getElementById('cam_output');
    const context = canvasElement.getContext('2d');

    //canvas 태그로부터 frame 받아오기
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    const imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height).data;
    
    //python server로 websocket을 사용해 frame 전달 
    webSocket_client.send(imageData);
    setTimeout(captureFrame, 1000 / FPS); 
}

const frame_list = [];
// 클라이언트 장치 내에서 상황 탐지 후 전달받은 데이터
// 데이터 형태는 danger & frame & date
webSocket_client.onmessage = async function(event){
    
    // 전달 받은 danger & frame : str to obj
    var data_obj = JSON.parse(event.data);

    // 클라이언트에서 보내준 frame은 인코딩 되어 있는 상태
    // uint8clampedarray type으로 변경 후 서버로 전송
    // 서버에서 스트리밍 가능
    var decodedFrame = new Uint8ClampedArray(atob(data_obj.frame).split('').map(function (c) {
        return c.charCodeAt(0);
    }));
    
    // danger 전달을 위한 처리과정
    var buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, data_obj.danger);

    // date -> byte로
    var byte_date = new TextEncoder().encode(data_obj.date);
    
    // frame -> danger -> date 순서로 보냄
    webSocket_server.send(decodedFrame);
    webSocket_server.send(buffer);
    webSocket_server.send(byte_date);
}   

webSocket_server.on('disconnect', () => {
    console.log('연결이 끊어졌습니다.');
    showDisconnectedMessage();
});

window.onload = function () {
    getVideoStream()
        .then(() => {    
            captureFrame();
        });
};

