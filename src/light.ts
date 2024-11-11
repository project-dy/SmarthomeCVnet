import vertx from "./vertx.js";
interface Light {
  number: number;
  dimming: number;
  title: string;
  zone: number;
}

interface LightInfo {
  contents: Light[];
  dev: number;
  id: string;
  is_use: boolean;
  result: number;
  tcp_remote_addr: string;
  websock_address: string;
}

interface Bulb {
  UniqueId: string;
  DisplayName: string;
  Dimming: boolean;
}

let lights: Light[];

// @ts-expect-error undefined[]
const currentBrightnessRatio: {
  [index: string]: number;
} = []; // 밝기 조정가능 조명의 현재 밝기값(백분율%) 0 ~ 100%

let control_light: (_rnum: string, _brightnessRatio: number) => void;
let control_dimming: (_roomnum: string, _value: number) => void;

async function light(
  server: string,
  id: string,
  password: string,
  deviceId: string,
  tokenId: string,
  cookies: string,
) {
  console.log(server, id, password, deviceId, tokenId, cookies);
  // return;

  let bTryAutoLogin = false;
  let WEBSOCK_ADDRESS: string | null = null;
  let wsClient: vertx.EventBus | null = null;
  let subscribed = false;
  let address: string | null = null;
  let userId: string | null = null;
  let remote_addr: string | null = null;
  let lightsPromiseResolve: any;

  let currentDimmingLightOnOff = 0;
  // @ts-expect-error undefined[]
  const light_onoff: {
    [index: string]: number;
  } = [];
  let lightonoff = true;
  let dimming_cnt = 0;
  let nowDimmingNum, nowDimmingValue;

  let dimming_min = 1;
  let dimming_max = 10;
  let dimming_step = 1;
  dimming_min = 1;
  dimming_max = 5;
  dimming_step = 2;

  // $(document).ready(function () {
  //   //setFontSizeCSS();
  //   setLanguage(parent.site_lang);

  //   $("body").addClass(parent.site_name);
  //   $("body").show();
  //   //setFontSizeCSS();
  //   if (parent.isDemoMode) {
  //     onDemoReady();
  //   } else {
  //     init();
  //   }
  //   checkBoxInit();

  //   const dimming = parent.site_options.dimming;
  //   if (dimming && dimming.length === 3) {
  //     dimming_min = dimming[0];
  //     dimming_max = dimming[1];
  //     dimming_step = dimming[2];
  //   }

  //   $("#dimming_slider").attr("min", dimming_min);
  //   $("#dimming_slider").attr("max", dimming_max);
  //   $("#dimming_slider").attr("step", dimming_step);

  //   $("#dimming_value").html($("#dimming_slider").val() + "단계");
  //   $("#div-slider").change(function () {
  //     if (light_onoff[nowDimmingNum] == 1) {
  //       const slider_value = $("#dimming_slider").val();
  //       //$('#dimming_value').html(slider_value + '단계');
  //       $("#dimming_value").html(
  //         '<div class="span_group"><div class="value_span">' +
  //           slider_value +
  //           '</div><div class="flag_span">단계</div></div>',
  //       );
  //     }
  //   });

  //   $(".switch_squear_off").bind("touchstart touchend", function () {
  //     $(this).toggleClass("switch_squear_off_active");
  //   });

  //   $(".switch_squear_on").bind("touchstart touchend", function () {
  //     $(this).toggleClass("switch_squear_on_active");
  //   });

  //   $("#btn_dimming_submit").bind("touchstart touchend", function () {
  //     $(this).toggleClass("btnSubColor_active");
  //   });

  //   $("#btn_allOn").bind("touchstart touchend", function () {
  //     $(this).toggleClass("btnMainColor_active");
  //   });
  //   $("#btn_allOff").bind("touchstart touchend", function () {
  //     $(this).toggleClass("btnGrayColor_active");
  //   });
  // });

  /************************************************************************
   *                             Button
   ************************************************************************/

  // function unInit() {
  //   setTimeout(function () {
  //     if (wsClient != null) {
  //       wsClient.close();
  //       wsClient = null;
  //       subscribed = false;
  //       console.log("close web socket");
  //     }
  //   }, 200);
  // }

  // // 전체 켜기
  // $(document).on("touchend", "#btn_allOn", function () {
  //   if (parent.isDemoMode) {
  //     for (key in light_onoff_demo) {
  //       light_onoff_demo[key] = 1;
  //     }
  //   }
  // });

  // // 전체 끄기..
  // $(document).on("touchend", "#btn_allOff", function () {
  //   if (parent.isDemoMode) {
  //     for (key in light_onoff_demo) {
  //       light_onoff_demo[key] = 1;
  //     }
  //   }
  //   control_light_all(0); // off
  // });

  // //디밍
  // $(document).on("touchend", "#btn_dimming_submit", function () {
  //   const value = Number($("#dimming_slider").val());
  //   control_dimming(nowDimmingNum, value);
  // });

  /************************************************************************
   *                             web socket
   ************************************************************************/
  function init() {
    // $.ajax({
    //   url: "device_info.do",
    //   type: "post",
    //   data: { type: "0x12" }, // 0x12: 조명
    //   dataType: "json",
    //   cache: false,
    //   success: function (data) {
    //     console.log("device_info : ", data);
    //     if (data.result == 0) {
    //       console.log("서버와의 접속이 끊겼습니다.");
    //       console.log("Login Session Expired.... try AutoLogin...");
    //       //location.href="login.view";

    //       // 자동로그인 체크..
    //       autoLoginCheck("device_info.do");
    //     } else {
    //       if (data.result == 1) {
    //         onReady(data);
    //       } else if (data.result == -1) {
    //         console.log("time out");
    //       }
    //     }
    //   },
    //   error: function (xhr, status, error) {
    //     console.log(
    //       "/mobile/device_info.do - code:" +
    //         xhr.status +
    //         "\n" +
    //         "error:" +
    //         error,
    //     );
    //     if (xhr.status == 401 || xhr.status == 0) {
    //       console.log("Login Session Expired.... try AutoLogin...");
    //       //location.href="login.view";

    //       // 자동로그인 체크..
    //       autoLoginCheck("device_info.do");
    //     }
    //   },
    //   beforeSend: function (xhr) {
    //     xhr.setRequestHeader("AJAX", "true"); // ajax 호출을 header 에 기록
    //   },
    // });
    fetch(server + "/cvnet/mobile/device_info.do", {
      credentials: "include",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        AJAX: "true",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Sec-GPC": "1",
        cookie: cookies,
      },
      referrer: server + "/cvnet/mobile/light.view",
      body: "type=0x12",
      method: "POST",
      mode: "cors",
    }).then(async (response) => {
      const data = await response.json();
      console.log("device_info : ", data);
      if (data.result == 0) {
        console.log("서버와의 접속이 끊겼습니다.");
        console.log("Login Session Expired.... try AutoLogin...");
        //location.href="login.view";

        // 자동로그인 체크..
        autoLoginCheck("device_info.do");
      } else {
        if (data.result == 1) {
          onReady(data);
        } else if (data.result == -1) {
          console.log("time out");
        }
      }
    });
  }

  // 상태 응답....
  const handler = function (msg: string) {
    //, replyTo) {
    console.log("message", msg);
    if (wsClient == null) {
      return;
    }

    const jsonObj = JSON.parse(msg);
    lightonoff = true;

    let status;
    if (jsonObj.status == 0x01) {
      status = "정상";
    } else if (jsonObj.status == 0xff) {
      status = "통신단절";
      console.log(status);
      return;
    } else if (jsonObj.status == 0xfe) {
      status = "주소에러";
      console.log(status);
      return;
    }

    const light_id: string = jsonObj.zone + "-" + jsonObj.number;
    light_onoff[light_id] = jsonObj.onoff;

    if (jsonObj.number <= dimming_cnt) {
      let tempBrightness: number = jsonObj.brightness;
      if (tempBrightness > dimming_max) {
        tempBrightness = dimming_max;
      }

      currentBrightnessRatio[light_id] = tempBrightness;

      console.log("dimming_cnt:", dimming_cnt);
      console.log("currentBrightnessRatio:", currentBrightnessRatio);
      currentDimmingLightOnOff = jsonObj.onoff;
    }
  };

  function onReady(light_info: LightInfo) {
    const jsonObj = light_info;
    console.log(JSON.stringify(jsonObj));
    lights = jsonObj.contents;
    lightsPromiseResolve(lights);
    lightsPromiseResolve = null;
    let cnt = 0;
    const totalCnt = Math.ceil(jsonObj.contents.length / 6);

    const pagecnt = Number(jsonObj.contents.length);
    console.log("pagecnt: " + pagecnt);
    console.log("totalCnt: " + totalCnt);
    console.log("light_info: ", light_info);

    if (jsonObj != null && jsonObj.is_use == true && jsonObj.result == 1) {
      if (jsonObj.contents.length <= 6) {
        for (let i = 0; i < jsonObj.contents.length; i++) {
          const light = jsonObj.contents[i];

          if (light.zone == undefined) {
            light.zone = 1;
          }
          const light_id = light.zone + "-" + light.number;
          if (light.title !== "방") {
            if (light.dimming == 1) {
              dimming_cnt++;
            }
          }
        }
      } else {
        for (let i = 0; i < jsonObj.contents.length; i++) {
          const light = jsonObj.contents[i];
          const light_id = light.zone + "-" + light.number;
          console.log("light.title:", light.title);
          if (light.title !== "방") {
            if (light.dimming == 1) {
              if (cnt == 5) {
                cnt = 0;
              } else {
                cnt++;
              }
              dimming_cnt++;
            } else {
              if (cnt == 5) {
                cnt = 0;
              } else {
                cnt++;
              }
            }
          }
        }
      }

      WEBSOCK_ADDRESS = jsonObj.websock_address;
      remote_addr = jsonObj.tcp_remote_addr;
      // 접속 시도..
      connect(jsonObj.id, String(jsonObj.dev), jsonObj.tcp_remote_addr);
    } else {
      console.log("서버와의 접속이 끊겼습니다.");
    }
  }

  // 접속..
  function connect(id: string, dev: string, remote_addr: string) {
    console.log("접속 시도 : ", id, " / ", dev, " / ", remote_addr);
    if (wsClient == null && WEBSOCK_ADDRESS) {
      wsClient = new vertx(WEBSOCK_ADDRESS);

      wsClient.onopen = function () {
        console.log("connected to server");

        wsClient.login(id, "cvnet", (reply: any) => {
          // reply : 로그인 결과 json
          console.log("reply:", reply);
          if (reply.result == true && reply.id == id) {
            console.log("succeed login");

            if (wsClient && !subscribed) {
              wsClient.registerHandler(dev, handler);
              console.log("succeed register");
              subscribed = true;
              address = dev;
              userId = id;
              requestStatus();
            }
          } else {
            console.log("로그인 실패!");
          }
        });
      };

      wsClient.onclose = function () {
        console.log("close");
        wsClient = null;
        subscribed = false;
      };
    }
  }

  // 상태 값 요청...
  function requestStatus() {
    if (subscribed == false) {
      console.log("현재 화면 주소가 필요합니다.");
      return;
    }

    if (wsClient != null && address != null) {
      const json = new Object();
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.id = userId;
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.remote_addr = remote_addr;
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.request = "status";

      wsClient.publish(address, JSON.stringify(json), null);
    }
  }

  /************************************************************************
   *                             AJAX
   ************************************************************************/

  ///// 자동로그인 시도.......
  function autoLoginCheck(_servletName: string) {
    if (bTryAutoLogin == true) {
      bTryAutoLogin = false;
      // parent.toLoginPage();
      return;
    }

    bTryAutoLogin = true;

    $.ajax({
      url: "auto_login_check.do",
      type: "post",
      data: {
        name: _servletName,
        deviceId: deviceId,
        tokenId: tokenId,
      },
      dataType: "json",
      cache: false,
      success: function (data) {
        if (data.result == 1) {
          console.log("Auto Login Success: " + data.result);
          if (data.servlet_name == "device_info.do") {
            init();
          } else {
            console.log(
              "Login Session Expired - no autologin info....code: " +
                data.result,
            );
            console.log(data.message);
            // parent.toLoginPage();
          }
        }
      },
      error: function (xhr, status, error) {
        console.log(
          "tablet/auto_login_check.do - code:" +
            xhr.status +
            "\n" +
            "error:" +
            error,
        );
        //if(xhr.status == 401 || xhr.status == 0)
        {
          console.log("Login Session Expired - no autologin info....");
          // parent.toLoginPage();
        }
      },
    });
  }

  /************************************************************************
   *                             function
   ************************************************************************/

  // 개별 조명 제어....
  control_light = (_rnum: string, _brightnessRatio: number) => {
    const _roomnum = _rnum;
    const rnumValue = _roomnum.split("-");
    // const onoff;
    if (wsClient == null) {
      return;
    }

    if (light_onoff[_roomnum] == 1) {
      light_onoff[_roomnum] = 0;
    } else if (light_onoff[_roomnum] == 0) {
      light_onoff[_roomnum] = 1;
    }

    if (subscribed == false) {
      console.log("need subcribed address");
      return;
    }

    if (
      wsClient != null &&
      address != null &&
      remote_addr != null &&
      userId != null
    ) {
      const json = new Object();
      if (_brightnessRatio == -1) {
        _brightnessRatio = 0; //Modified by jhchoi. 2016-06-23
      }
      const brightValue = _brightnessRatio;

      console.log(
        'light_onoff[_roomnum]+"" :',
        light_onoff[_roomnum],
        "roomnum:",
        _roomnum,
      );

      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.id = userId;
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.remote_addr = remote_addr;
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.request = "control";
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.number = rnumValue[1] + ""; // 1~ 48
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.onoff = light_onoff[_roomnum] + ""; // 1: 켜기, 0: 끄기
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.brightness = brightValue + ""; // 0 ~ 10
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.zone = rnumValue[0] + "";
      wsClient.publish(address, JSON.stringify(json), null);
    }
  };

  // 개별 조명 제어....
  control_dimming = (_roomnum: string, _value: number) => {
    if (wsClient == null) {
      return;
    }

    if (subscribed == false) {
      console.log("need subcribed address");
      return;
    }

    if (
      wsClient != null &&
      address != null &&
      remote_addr != null &&
      userId != null
    ) {
      const json = new Object();
      const brightValue = _value;
      const rnum = _roomnum.split("-");
      console.log("light_onoff[_roomnum] :", light_onoff[_roomnum]);
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.id = userId;
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.remote_addr = remote_addr;
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.request = "control";
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.number = rnum[1] + ""; // 1~ 48
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.onoff = light_onoff[_roomnum] + ""; // 1: 켜기, 0: 끄기
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.brightness = brightValue + ""; // 0 ~ 10 (or min ~ max)
      // @ts-expect-error 위에서 Object로 선언해서 타입정보 1도 없음
      json.zone = rnum[0] + "";
      wsClient.publish(address, JSON.stringify(json), null);
    }
  };

  // // 전체 조명 제어
  // function control_light_all(_onoff) {
  //   if (subscribed == false) {
  //     console.log("need subcribed address");
  //     return;
  //   }
  //   if (
  //     wsClient != null &&
  //     address != null &&
  //     remote_addr != null &&
  //     userId != null
  //   ) {
  //     const json = new Object();
  //     json.id = userId;
  //     json.remote_addr = remote_addr;
  //     json.request = "control_all";
  //     json.onoff = _onoff + ""; // 1: 켜기, 0: 끄기
  //     json.brightness = "0"; //Modified by jhchoi. 2016-06-23
  //     json.zone = "0";
  //     wsClient.publish(address, JSON.stringify(json), null);
  //   }
  // }

  // function control_light_dimming(title, number) {
  //   if (light_onoff[number] == undefined) {
  //     lightonoff = false;
  //   }
  //   /*
  //      if(light_onoff[number]  == 1){
  //      $('#switch').lcs_on();
  //      }else{
  //      $('#switch').lcs_off();
  //      }
  //      */
  //   nowDimmingNum = number;
  //   console.log(
  //     "currentBrightnessRatio : ",
  //     currentBrightnessRatio[nowDimmingNum],
  //   );
  // }

  // control_dimming(nowDimmingNum, currentBrightnessRatio[nowDimmingNum]); // 디밍
  // // control_light_all(1); // 전체 켜기

  init();
  function waitForLights() {
    if (lights !== undefined) {
      return Promise.resolve(lights);
    }
    return new Promise((resolve) => {
      lightsPromiseResolve = resolve;
    });
  }
  await waitForLights();
  console.log("Resolved");
}

async function getLights() {
  // uuid는 zone-number로 하자
  let bulbs: Bulb[];
  lights.forEach((light, index) => {
    const dimmable = light.dimming == 1;
    if (!bulbs) {
      bulbs = [
        {
          UniqueId: `Z${(light.zone + 10).toString(36).toUpperCase()}N${(light.number + 10).toString(36).toUpperCase()}`,
          // UniqueId: `ZAA${(index + 10).toString(36).toUpperCase()}`,
          DisplayName: light.title,
          // DisplayName: `Light ${(index + 10).toString(36).toUpperCase()}`,
          Dimming: dimmable,
        },
      ];
      return;
    }
    bulbs.push({
      UniqueId: `Z${(light.zone + 10).toString(36).toUpperCase()}N${(light.number + 10).toString(36).toUpperCase()}`,
      // UniqueId: `ZAA${(index + 10).toString(36).toUpperCase()}`,
      DisplayName: light.title,
      // DisplayName: `Light ${(index + 10).toString(36).toUpperCase()}`,
      Dimming: dimmable,
    });
  });
  return bulbs;
}

async function isLightTurnedOn(uniqueId: string) {
  const light = currentBrightnessRatio[uniqueId];
  console.log(`Light ${uniqueId} is turned ${light > 0 ? "on" : "off"}`);
  return light > 0;
}

async function getDimmingLevel(uniqueId: string) {
  return currentBrightnessRatio[uniqueId];
}

async function toggleLight(uniqueId: string) {
  control_light(uniqueId, -1);
}

async function setDimmingLevel(uniqueId: string, level: number) {
  control_dimming(uniqueId, level);
}

export default light;
export {
  getLights,
  isLightTurnedOn,
  getDimmingLevel,
  toggleLight,
  setDimmingLevel,
};
