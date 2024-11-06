import { Cookie, CookieJar } from "tough-cookie";
const cookieJar = new CookieJar();
let cookies: Cookie[] | undefined;
import light, { getLights } from "./light.js";
async function login_first(
  server: string,
  id: string,
  password: string,
  deviceId: string,
  tokenId: string,
) {
  // $.ajax({
  //   url: server + "/cvnet/mobile/login.do",
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/x-www-form-urlencoded",
  //   },
  //   data: {
  //     id: id,
  //     password: password,
  //     deviceId: 0,
  //     tokenId: 0,
  //   },
  //   success: function (res, status, xhr) {
  //     console.log(xhr.getResponseHeader("set-cookie"));
  //     const setCookieHeader = xhr.getResponseHeader("set-cookie");
  //     if (setCookieHeader) {
  //       const cookie = Cookie.parse(setCookieHeader);
  //       cookieJar.setCookie(cookie, server + "/cvnet/mobile/login.view");
  //       if (!cookies) cookies = cookie;
  //       console.log("cookies", cookies);
  //     }
  //     initializationFunction(window);
  //     // throw new Error('Login Success');
  //   },
  // });
  console.log("login_first");
  // console.log(
  //   new URLSearchParams({
  //     id: id,
  //     password: password,
  //     deviceId: deviceId,
  //     tokenId: tokenId,
  //   }).toString(),
  // );
  // return;
  const res = await fetch(server + "/cvnet/mobile/login.do", {
    credentials: "include",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "en-US,en;q=0.5",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Sec-GPC": "1",
      Priority: "u=0",
    },
    referrer: server + "/cvnet/mobile/login.view",
    body: new URLSearchParams({
      id: id,
      password: password,
      deviceId: deviceId,
      tokenId: tokenId,
    }).toString(),
    method: "POST",
    mode: "cors",
  });
  console.log(res.ok, res.headers.getSetCookie());
  const body = JSON.parse(await res.text());
  console.log(body.result === 1);
  if (res.ok && body.result === 1) {
    const setCookieHeaders = res.headers.getSetCookie();
    if (setCookieHeaders) {
      setCookieHeaders.forEach((setCookieHeader, count) => {
        const cookie = Cookie.parse(setCookieHeader);
        cookieJar.setCookie(cookie, server + "/cvnet/mobile/login.view");
        if (!cookies) {
          cookies = [];
          cookies[count] = cookie;
        }
        console.log("cookies", cookies);
      });
      await light(server, id, password, deviceId, tokenId, cookies.join(";"));
      // console.log(
      //   `Get LightsLightsLightsLightsLightsLightsLightsLightsLights: ${JSON.stringify(await getLights())}`,
      // );
    }
  }
}

export { login_first };
