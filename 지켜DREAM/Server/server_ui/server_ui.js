// var for_map_websocket = new WebSocket('ws://localhost:5555');

var socketIo = io.connect('http://localhost:5111'
, { transports: ['websocket'] });

socketIo.on('connect', function(){
    console.log('connect');
})

const canvas = document.getElementById('cam_img');
const ctx = canvas.getContext('2d');

'speechSynthesis' in window ? console.log("Web Speech API supported!") : console.log("Web Speech API not supported :-(");
const synth = window.speechSynthesis;

socketIo.on('frame_message', function(data){
    console.log('get');
    var decodedFrame = new Uint8ClampedArray(atob(data).split('').map(function (c) {
        return c.charCodeAt(0);
    }));

    var imageData = ctx.createImageData(224, 224);
    var data = imageData.data;

    for (let i = 0; i < decodedFrame.length; i++) {
        
        // 이미지 데이터가 하나의 배열로 펼쳐져 있으므로 RGBA 값 순서대로 설정
        data[i * 4/3] = decodedFrame[i];     // Red
        data[i * 4/3 + 1] = decodedFrame[i + 1]; // Green
        data[i * 4/3 + 2] = decodedFrame[i + 2]; // Blue
        data[i * 4/3 + 3] = 255;             // Alpha (fully opaque)
    }
    ctx.putImageData(imageData, 0, 0);
    
})

socketIo.on('danger_message', function(data){
    console.log(data);
})
