// 開始する日付
var startDay;
// 始業時間
var openingTime;
// 就業時間
var closingTime;
// 週の表示
var weekNames;
// ガントチャートに表示するタスク
var task;
// 詳細をTooltipで表示するかどうか
var shownTooltip;

//定数
const urlSetting = "properties/setting.json";
const urlTasks = "properties/tasks.json";
const oneHour = 60;
const halfHour = oneHour / 2;

// task配列が存在する日の回数分、チャートを表示するdaily-area要素を描画する
const dailyAreaDOM = () => {
  for (let i = 0; i < Object.keys(task).length; i++) {
    const contentObj = document.getElementById("easygantt");
    const chartElement = document.createElement('div');
    chartElement.className = 'chart';
    contentObj.appendChild(chartElement);
    const chartArea = document.querySelectorAll(".chart");
    chartArea[i].innerHTML = `
      <span id="date${i}"></span>
      <div class="daily-area">
        <div class="scale"></div>
        <ul class="data" id="task${i}"></ul>
      </div>
      `;
  }
}

// 始業時間と就業時間から、30分区切りでhh:mmというフォーマットに変換する
const setTimeScale = (open, close) => {
  openMin = convertTimesToMins(open);
  closeMin = convertTimesToMins(close);
  workingMin = closeMin - openMin;
  timeScale = [];
  scaleDiv = workingMin / halfHour;
  for (let i = 0; i <= scaleDiv; i++) {
    timeScale[i] = String((openMin + (i * halfHour)) / oneHour);
    if (timeScale[i].slice(-2) === ".5") {
      timeScale[i] = ""
    }
  }
}

// #easygantt要素の幅を取得して、scaleを均等に分割する
const setTimeScaleWidth = () => {
  clientWidth = document.getElementById('easygantt').clientWidth;
  // TODO: 2をうまく決めたい
  const singleTimeScaleWidth = Math.floor(clientWidth / (this.scaleDiv + 1)) - 2;
  return singleTimeScaleWidth;
}

// setTimeScaleWidthで取得したひとつあたりのtimeScaleの値に応じたwidthで、時間軸を描画する
const scaleDOM = (i, width) => {
  const scale = document.querySelectorAll(".scale");
  scale[i].insertAdjacentHTML('beforeend', '<div class="hr">')
  for (let j = 0; j < timeScale.length; j++) {
    scale[i].insertAdjacentHTML('beforeend', `
      <section style="width: ${width}px;">${timeScale[j]}</section></div>
    `);
  }
}

// startDayの値をmm/dd(w)のフォーマットにして描画する
const dateDOM = (i) => {
  const taskDay = new Date(startDay.year, startDay.month - 1, startDay.day + i);
  const m = taskDay.getMonth() + 1;
  const d = taskDay.getDate();
  const w = taskDay.getDay();
  document.getElementById("date" + [i]).innerText = `${m}/${d}(${weekNames[w % 7]})`;
}

// hhmmのフォーマットの時間を分数にして返す
const convertTimesToMins = (time) => {
  let hour = parseInt(String(time).slice(0, -2));
  let min = parseInt(String(time).slice(-2));
  let sumMins = hour * oneHour + min;
  return sumMins;
}

// tasks.jsの配列をもとに、チャートにバブルを描画する
const bubbleDOM = (i, j, start, duration, element, width) => {
  // 1分あたりのバブルの長さ[px] = (width+縦線の太さ)/30分
  let widthAboutMin = (width + 0.5) / halfHour;
  // 始業からタスク開始までの分数
  let startTaskMin = start - convertTimesToMins(openingTime);
  var html = `<li><div class="${task[i][j].category}">
  <span class="bubble" style="margin-left: ${startTaskMin * widthAboutMin}px;width: ${duration * widthAboutMin}px;">`
  html += shownTooltip?`
    <span class="tooltip">
      <span class="context">
        ${bubbleData(i, j)}
      </span>
    </span>
  </span>`: `</span>${bubbleData(i, j)}`
  html += `</div></li>`;
  element.insertAdjacentHTML('beforeend', html);
}

// task配列のデータを、「hh:mm-hh:mm タスクの説明」のフォーマットにして返す
const bubbleData = (i, j) => {
  return task[i][j].category !== "milestone"?
    `<span class="time">
      ${String(task[i][j].startTime).slice(0, -2)}:${String(task[i][j].startTime).slice(-2)}
      -${String(task[i][j].endTime).slice(0, -2)}:${String(task[i][j].endTime).slice(-2)}
    </span>
    <span class="bubble-span">${task[i][j].name}</span>`:
    `<span class="time">${String(task[i][j].startTime).slice(0, -2)}:${String(task[i][j].startTime).slice(-2)}</span>
    <span class="milestone-span">${task[i][j].name}</span>`;
}

// DOMのレンダリングを実行する
const renderDom = () => {
  dailyAreaDOM();
  let startTimeToMins = [], endTimeToMins = [], durationTimes = [];
  for (let i = 0; i < Object.keys(task).length; i++) {
    if (task[i][0]) {
      setTimeScale(openingTime, closingTime);
      timeScaleWidth = setTimeScaleWidth();
      scaleDOM(i, timeScaleWidth);
      dateDOM(i);
      let createBubble = document.getElementById(`task${i}`);
      startTimeToMins[i] = [], endTimeToMins[i] = [], durationTimes[i] = [];
      for (let j = 0; j < Object.keys(task[i]).length; j++) {
        bubbleDOM(i, j,
          convertTimesToMins(task[i][j].startTime),
          (convertTimesToMins(task[i][j].endTime) - convertTimesToMins(task[i][j].startTime)),
          createBubble,
          timeScaleWidth
        );
      }
    } else {
      document.getElementById(`date${i}`).parentElement.style = "display:none;"
    }
  }
}

const getJson = (url, callback) => {
  const request = new XMLHttpRequest();
  request.overrideMimeType("application/json");
  request.open("GET", url, true);
  request.onreadystatechange = () => {
    if (request.status == 200) {
      if (request.readyState == 4 && request.responseText) {
        const result = JSON.parse(request.responseText)
        callback(result);
      }
    } else {
      console.error(url + "の取得に失敗しました。");
    }
  };
  request.send(null);
}

// task配列をtasks.jsonから取得する。
const getTask = () => {
  getJson(urlTasks,
    (result) => {
      task = result;
      renderDom();
    }
  );
}

window.onload = () => {
  getJson(urlSetting,
    (result) => {
      startDay = result.startDay;
      openingTime = result.openingTime;
      closingTime = result.closingTime;
      weekNames = result.weekNames;
      shownTooltip = result.shownTooltip;
      getTask();
    }
  );
}

// TODO: onresize
