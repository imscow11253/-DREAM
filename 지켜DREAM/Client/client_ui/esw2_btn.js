// 웹 UI 구성에 필요한 함수

const clock = document.getElementById("clock");
const calender = document.getElementById("calender");
var Today_date;

// 날씨 아이콘 불러오기
let weatherIcon = {
    '01d' : 'wi wi-day-sunny',
    '02d' : 'wi wi-day-cloudy',
    '03d' : 'wi wi-cloudy',
    '04d' : 'wi wi-day-cloudy',
    '09d' : 'wi wi-day-showers',
    '10d' : 'wi wi-day-rain',
    '11d' : 'wi wi-day-lightning',
    '13d' : 'wi wi-day-snow',
    '50d' : 'wi wi-day-fog',

    '01n' : 'wi wi-night-clear',
    '02n' : 'wi wi-night-alt-cloudy',
    '03n' : 'wi wi-cloudy',
    '04n' : 'wi wi-night-alt-cloudy',
    '09n' : 'wi wi-night-alt-showers',
    '10n' : 'wi wi-night-alt-rain',
    '11n' : 'wi wi-night-alt-lightning',
    '13n' : 'wi wi-night-alt-snow',
    '50n' : 'wi wi-night-alt-fog',
}

let dust_grade_icon = {
    '1' : 'fa-regular fa-face-laugh',
    '2' : 'fa-regular fa-face-meh',
    '3' : 'fa-regular fa-face-frown-open',
    '4' : 'fa-regular fa-face-angry'
}

let dust_grade = {
    '1' : '좋음',
    '2' : '보통',
    '3' : '나쁨',
    '4' : '메우 나쁨'
}

// 아이콘 삭제
function removeITagsInClass(className) {
    const elements = document.querySelectorAll(`.${className} i`);
    elements.forEach((element) => element.parentNode.removeChild(element));
}
// 날짜 생성
function getCalender(){
    var week = new Array('일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일');

    var now = new Date();
    var year  = now.getFullYear();
    var month = now.getMonth() + 1;
    var date  = now.getDate();
    
    var day = now.getDay();
    day = week[day];
    
    if(month < 10){
        month = '0' + month;
    }

    if(date < 10){
        date = '0' + date;
    }

    Today_date = year + month + date;
    
    calender.innerText = `${year}.${month}.${date} /  ${day}`;
}
// 시간 생성
function getClock(){
    var now   = new Date();
    var hours   = now.getHours();
    var minutes = now.getMinutes();
    var second = now.getSeconds();
    
    if(hours < 10){
        hours = '0' + hours;
    }
    if(minutes < 10){
        minutes = '0' + minutes;
    }
    if(second < 10){
        second = '0' + second;
    }
    
    if(hours >= 12){
        $('#daynight').text("오후");
    }else{
        $('#daynight').text("오전");
    }

    clock.innerText = `${hours}:${minutes}:${second}`;
}

// 첫번째 날씨 불러오기
function update_temp(){
    $.ajax({
        url : 'https://api.openweathermap.org/data/2.5/weather?q=seoul&appid=dc6a680dbd076f8c83bb0fa3816f3cfa&units=metric',
        dataType:'json',
        type:'GET',
        success : function(data){
            
            var $Icon = (data.weather[0].icon);
            var $Temp = Math.floor(data.main.temp) + '°C';
            var $city = data.name;
            
            var weaIcon = '<i class="' + weatherIcon[$Icon] + '"></i>';
            
            $('.temp').empty();
            $('.local').empty();
            
            removeITagsInClass('weather_img');
            $('.weather_img').append(weaIcon);
            
            $('.temp').append($Temp);
            $('.local').append('서울, 광진구');
        }
    })
}
// 이후 날씨 불러오기
function update_temp2(){
    $.ajax({
        url : 'http://api.openweathermap.org/data/2.5/forecast?q=seoul&appid=dc6a680dbd076f8c83bb0fa3816f3cfa&units=metric',
        dataType : 'json',
        type:'GET',

        success:function(data){
            
            for(let i = 0; i < 3; i++){
                var _list = data.list[i];
                var $Icon = (_list.weather[0].icon);
                var $Temp = Math.floor(_list.main.temp) + '°C';

                // var $Time = Number(_list.dt_txt[11] + _list.dt_txt[12]) + 9;

                var $Day = data.list[i + 3].dt_txt[5] + data.list[i + 3].dt_txt[6] + '/' + data.list[i + 3].dt_txt[8] + data.list[i + 3].dt_txt[9];

                var $Time = data.list[i + 3].dt_txt[11] + data.list[i + 3].dt_txt[12] + '시';
                var weaIcon = '<i class="' + weatherIcon[$Icon] + '"></i>';
                
                $(`.temp${i + 1}`).empty();
                $(`.date${i + 1}`).empty();
                $(`.day${i + 1}`).empty();
                
                removeITagsInClass(`weather_img${i + 1}`);
                $(`.weather_img${i + 1}`).append(weaIcon);
            
                $(`.temp${i + 1}`).append($Temp);
                $(`.date${i +1}`).append($Time);
                $(`.day${i +1}`).append($Day);
            }
        }
    })
}

function update_dust(){
    $.ajax({
        url : 'http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?stationName=광진구&dataTerm=DAILY&pageNo=1&numOfRows=100&returnType=json&serviceKey=uON4LCwQXSqdXYs3AkCPNmdiocpVvTz5g0HkdCxa2lipEHTGrUC1L%2B4nkq122dTbD9cpAuOSlIlVBaO1KX0nEA%3D%3D&ver=1.0',
        type : 'GET',
        dataType : 'json',
        success:function(data){
            var data = data.response.body.items[0];
            var date_time = data['dataTime'][11] + data['dataTime'][12] + '시';
            // no2, o3, pm10, pm25
            var pm10_grade = dust_grade_icon[data['pm10Grade']];
            var pm25_grade = dust_grade_icon[data['pm25Grade']];
            
            var pm10_grade_word = dust_grade[data['pm10Grade']];
            var pm25_grade_word = dust_grade[data['pm25Grade']];

            if(pm10_grade == undefined){
                pm10_grade = dust_grade_icon['1'];
                pm10_grade_word = '좋음';
            }
            if(pm25_grade == undefined){
                pm25_grade = dust_grade_icon['1'];
                pm25_grade_word = '좋음';
            }

            var pm10_value = data['pm10Value'] + ' ㎍/㎥';
            var pm25_value = data['pm25Value'] + ' ㎍/㎥';
            
            var pm10_word_append = `<span style = "margin : 0 auto;  font-size : 30px;">미세먼지</span>
            <h6 style = "margin : 0 auto; font-size : 15px;margin-bottom : 15px;">${pm10_value}</h6>`

            var pm25_word_append = `<span style = "margin : 0 auto; font-size : 30px;">초미세먼지</span>
            <h6 style = "margin : 0 auto; font-size : 15px; margin-bottom : 15px;">${pm25_value}</h6>`

            var pm10_icon_append = `<i class = "${pm10_grade}" style = "font-size : 60px; margin : 0 auto;"></i>`
            var pm25_icon_append = `<i class = "${pm25_grade}" style = "font-size : 60px; margin : 0 auto;"></i>`
            
            var pm10_grade_append = `<span>${pm10_grade_word}</span>`;
            var pm25_grade_append = `<span>${pm25_grade_word}</span>`;

            $('.dust_word_pm25').empty();
            $('.dust_word_pm10').empty();

            $('.dust_icon_pm25').empty();
            $('.dust_icon_pm10').empty();

            $('.dust_grade_pm25').empty();
            $('.dust_grade_pm10').empty();

            $('.dust_word_pm25').append(pm25_word_append);
            $('.dust_word_pm10').append(pm10_word_append);
            
            $('.dust_icon_pm25').append(pm25_icon_append);
            $('.dust_icon_pm10').append(pm10_icon_append);

            $('.dust_grade_pm25').append(pm25_grade_append);
            $('.dust_grade_pm10').append(pm10_grade_append);
        },
        error:function(error){
            console.log(error);
        }
    })
}

$(document).ready(update_temp());
$(document).ready(update_temp2());
$(document).ready(update_dust());
// $(document).ready(tttt());  

setInterval(update_temp, 1800000);
setInterval(update_temp2, 1800000);
setInterval(update_dust, 900000);

getClock();
getCalender();
setInterval(getClock, 1000);
setInterval(getCalender, 1000);

// 서버 통신에 필요한 함수

// 현재 디바이스 위치(위도, 경도) (가정)
// var lan = 37.5;
// var lng = 127.5;

// device = {
//     'id' : 1,
//     'location' : [lan, lng],
//     'danger' : 1
// };

// function get_devices(){
//     $.ajax({
//         type:'GET',
//         url : 'http://localhost:5000/api/devices',
//         dataType:'json',
//         crossDomain:true,
//         success : function(data){
//             console.log(data);
//         },
//         error:function(error){
//             console.log(error);
//         }
//     })
// }

// // 특정 디바이스 정보 불러오기
// function get_device_info(){
//     $.ajax({
//         type:'GET',
//         url : 'http://localhost:5000/api/devices/1',
//         dataType:'json',
//         crossDomain:true,
//         success : function(data){
//             console.log(data);
//         },
//         error:function(error){
//             console.log(error);
//         }
//     })
// }

// // 디바이스 정보 업데이트
// // put은 되지만, flask 서버가 열려 있을 때만 적용되는 것.. or 웹브라우저 켜져 있을 때
// // 따라서, 여러 클라이언트를 사용하는 경우 DB제작이 필요해보임
// function device_update(){ 
//     $.ajax({
//         url: `http://localhost:5000/api/devices/${device['id']}`,
//         type:'PUT',
//         contentType:'application/json',
//         data : JSON.stringify(device),
        
//         success:function(response){
//             console.log(response);
//         },
//         error:function(error){
//             console.log(error);
//         }
//     })
// }

// $(document).ready(get_devices());
// $(document).ready(device_update());