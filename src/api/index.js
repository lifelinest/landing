// import axios from "axios";
import fetchJsonp from "fetch-jsonp";

/**
 * 音乐播放器
 */

// 获取音乐播放列表
export const getPlayerList = async (server, type, id) => {
  // 直接使用配置的API地址，不附加额外参数
  const res = await fetch(import.meta.env.VITE_SONG_API);
  const data = await res.json();

  // 适配uomg随机音乐API的返回格式
  if (data.code === 1 && data.data) {
    return [{
      name: data.data.name,
      artist: data.data.artistsname,
      url: data.data.url,
      cover: data.data.picurl,
      lrc: '', // 该API不提供歌词
    }];
  } else {
    console.error('音乐API返回错误:', data);
    return [];
  }
};

/**
 * 一言
 */

// 获取一言数据
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  return await res.json();
};

// 获取用户提供的一言 API
export const getNsmaoQuotes = async () => {
  const res = await fetch("https://api.nsmao.net/api/quotes/query?key=XPYdG7ccICDW47apDHcLzCVHiH");
  return await res.json();
};

/**
 * 天气
 */

// 获取高德地理位置信息
export const getAdcode = async (key) => {
  const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
  return await res.json();
};

// 获取高德地理天气信息
export const getWeather = async (key, city) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`,
  );
  return await res.json();
};

// 获取教书先生天气 API
// https://api.oioweb.cn/doc/weather/GetWeather
export const getOtherWeather = async () => {
  const res = await fetch("https://api.oioweb.cn/api/weather/GetWeather");
  return await res.json();
};

// 获取用户提供的天气 API
export const getNsmaoWeather = async () => {
  const res = await fetch("https://api.nsmao.net/api/weather/query?key=XPYdG7ccICDW47apDHcLzCVHiH");
  return await res.json();
};
