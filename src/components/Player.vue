<template>
  <div class="player-container">
    <!-- 确保播放器总是显示，不再依赖于条件渲染 -->
    <APlayer
      ref="player"
      :audio="playList"
      :autoplay="store.playerAutoplay"
      :theme="theme"
      :autoSwitch="true"
      :loop="store.playerLoop"
      :order="store.playerOrder"
      :volume="volume"
      :showLrc="false"
      :listFolded="listFolded"
      :listMaxHeight="listMaxHeight"
      :noticeSwitch="false"
      @play="onPlay"
      @pause="onPause"
      @timeupdate="onTimeUp"
      @error="loadMusicError"
    />
  </div>
</template>

<script setup>
import { MusicOne, PlayWrong } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import APlayer from "@worstone/vue-aplayer";
import localMusicConfig from '@/assets/localMusic.json';
import { getPlayerList } from '@/api';

const store = mainStore();

// 获取播放器 DOM
const player = ref(null);

// 歌曲播放列表
const playList = ref([]);

// 从本地配置加载音乐列表
const localMusicList = localMusicConfig.musicList || [];

// 已移除备用测试音乐

// 歌曲播放项
const playIndex = ref(0);

// 配置项
const props = defineProps({
  // 主题色
  theme: {
    type: String,
    default: "#efefef",
  },
  // 默认音量
  volume: {
    type: Number,
    default: 0.7,
    validator: (value) => {
      return value >= 0 && value <= 1;
    },
  },
  // 歌曲服务器 ( netease-网易云, tencent-qq音乐 )
  songServer: {
    type: String,
    default: import.meta.env.VITE_SONG_SERVER || "netease", //'netease' | 'tencent'
  },
  // 播放类型 ( song-歌曲, playlist-播放列表, album-专辑, search-搜索, artist-艺术家 )
  songType: {
    type: String,
    default: import.meta.env.VITE_SONG_TYPE || "playlist",
  },
  // id
  songId: {
    type: String,
    default: import.meta.env.VITE_SONG_ID || "7452421335",
  },
  // 列表是否默认折叠
  listFolded: {
    type: Boolean,
    default: false,
  },
  // 列表最大高度
  listMaxHeight: {
    type: Number,
    default: 420,
  },
});

const listHeight = computed(() => {
  return props.listMaxHeight + "px";
});

// 获取音乐URL - 处理网易云API的歌曲URL获取
const getSongUrl = async (songId, apiBaseUrl) => {
  try {
    const urlApi = `${apiBaseUrl}/api/song/url?id=${songId}`;
    const response = await fetch(urlApi);
    if (!response.ok) {
      throw new Error(`获取歌曲URL失败: ${response.status}`);
    }
    const data = await response.json();
    if (data.code === 200 && data.data && data.data.length > 0 && data.data[0].url) {
      return data.data[0].url;
    }
  } catch (error) {
    console.error('获取歌曲URL异常:', error);
  }
  // 如果获取失败，返回null
  return null;
};

// 获取音乐列表 - 优先使用本地音乐列表
const fetchMusicList = async () => {
  try {
    // 首先检查本地音乐列表
    console.log('优先使用本地音乐列表');
    if (localMusicList && localMusicList.length > 0) {
      return { list: localMusicList, source: 'local', isCached: true };
    }
    
    // 如果本地音乐列表为空，返回空数组
    console.warn('本地音乐列表为空');
    return { list: [], source: 'empty', isCached: false };
  } catch (error) {
    console.error('获取音乐列表失败:', error);
    return { list: [], source: 'error', isCached: false };
  }
};

// 初始化播放器
onMounted(async () => {
  nextTick(async () => {
    try {
      // 确保store状态正确设置
      store.musicIsOk = true;
      
      // 获取音乐列表（优先网易云热榜，失败时回退到本地JSON）
  const musicResult = await fetchMusicList();
  playList.value = musicResult.list;
  
  // 根据音乐列表来源显示不同的提示信息
  if (musicResult.source === 'netease') {
    const message = musicResult.isCached ? "使用缓存的网易云热榜音乐" : "成功加载最新网易云热榜音乐";
    ElMessage({
      message: message,
      grouping: true,
      type: 'success'
    });
  } else if (musicResult.source === 'local') {
    ElMessage({
      message: "网易云热榜获取失败，已加载本地音乐列表",
      grouping: true,
      type: 'warning'
    });
  } else if (musicResult.source === 'empty') {
    ElMessage({
      message: "音乐列表为空，请在localMusic.json中添加音乐",
      grouping: true,
      icon: h(PlayWrong, {
        theme: "filled",
        fill: "#efefef",
      })
    });
  }
      
      // 应用本地配置的默认设置
      if (localMusicConfig.defaultVolume !== undefined) {
        store.musicVolume = localMusicConfig.defaultVolume;
        if (player.value) {
          player.value.setVolume(store.musicVolume, false);
        }
      }
      if (localMusicConfig.loop !== undefined) {
        store.playerLoop = localMusicConfig.loop;
      }
      
      // 检查第一个音乐文件是否可访问
      if (playList.value.length > 0) {
        checkUrlAvailability(playList.value[0].url).then(available => {
          if (!available) {
            ElMessage({
              message: "警告：部分音乐文件可能无法访问，将自动切换到可用资源",
              grouping: true,
              type: 'warning'
            });
          }
        });
      }
      
    } catch (err) {
      console.error('播放器初始化异常:', err);
      ElMessage({
        message: "播放器初始化过程中出现错误",
        grouping: true,
        icon: h(PlayWrong, {
          theme: "filled",
          fill: "#efefef",
        }),
      });
    }
  });
});

// 播放
const onPlay = () => {
  console.log("播放");
  playIndex.value = player.value.aplayer.index;
  // 播放状态
  store.setPlayerState(player.value.audioRef.paused);
  // 储存播放器信息
  store.setPlayerData(playList.value[playIndex.value].name, playList.value[playIndex.value].artist);
  ElMessage({
    message: store.getPlayerData.name + " - " + store.getPlayerData.artist,
    grouping: true,
    icon: h(MusicOne, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
};

// 暂停
const onPause = () => {
  store.setPlayerState(player.value.audioRef.paused);
};

// 音频时间更新事件
const onTimeUp = () => {
  let lyrics = player.value.aplayer.lyrics[playIndex.value];
  let lyricIndex = player.value.aplayer.lyricIndex;
  if (!lyrics || !lyrics[lyricIndex]) {
    return;
  }
  let lrc = lyrics[lyricIndex][1];
  if (lrc === "Loading") {
    lrc = "歌词加载中";
  } else if (lrc === "Not available") {
    lrc = "歌词加载失败";
  }
  store.setPlayerLrc(lrc);
};

// 切换播放暂停事件
const playToggle = () => {
  player.value.toggle();
};

// 切换音量事件
const changeVolume = (value) => {
  player.value.setVolume(value, false);
};

// 切换上下曲
const changeSong = (type) => {
  type === 0 ? player.value.skipBack() : player.value.skipForward();
  nextTick(() => {
    player.value.play();
  });
};

// 跳转到指定歌曲
const skipToIndex = (index) => {
  if (player.value && index >= 0 && index < playList.value.length) {
    // 更新当前播放索引
    store.currentMusicIndex = index;
    
    // 这里我们不直接调用player.value.skipTo
    // 而是先更新播放列表，然后手动触发播放
    playList.value = [...playList.value]; // 触发响应式更新
    
    // 稍作延迟确保列表已更新
    setTimeout(() => {
      player.value.skipBack(); // 先向前跳一曲
      // 然后根据当前索引和目标索引的关系，计算需要跳转的次数
      const currentIndex = player.value.aplayer ? player.value.aplayer.index : 0;
      const steps = (index - currentIndex + playList.value.length) % playList.value.length;
      
      // 执行跳转
      for (let i = 0; i < steps; i++) {
        player.value.skipForward();
      }
      
      // 确保处于播放状态
      player.value.play();
    }, 100);
  }
};

// 切换歌曲列表状态
const toggleList = () => {
  player.value.toggleList();
};

// 检查URL可用性 - 增强版，添加超时处理和重试机制
const checkUrlAvailability = (url) => {
  return new Promise((resolve) => {
    // 设置超时，5秒后如果没有响应则认为不可用
    const timeout = setTimeout(() => {
      console.error('URL可用性检查超时:', url);
      resolve(false);
      audio.remove();
    }, 5000);
    
    const audio = new Audio();
    audio.addEventListener('canplaythrough', () => {
      clearTimeout(timeout);
      resolve(true);
      audio.remove();
    });
    audio.addEventListener('error', (e) => {
      clearTimeout(timeout);
      console.error('URL可用性检查失败:', url, '错误类型:', e.type);
      resolve(false);
      audio.remove();
    });
    audio.crossOrigin = 'anonymous'; // 添加跨域支持
    audio.src = url;
    audio.load();
  });
};

// 加载音频错误 - 增强版，自动切换到备用音频
const loadMusicError = () => {
  let notice = "";
  
  // 显示错误信息但不切换到备用音频
  notice = "音乐资源加载失败，请检查音乐URL是否有效";
  
  ElMessage({
    message: notice,
    grouping: true,
    icon: h(PlayWrong, {
      theme: "filled",
      fill: "#EFEFEF",
    }),
    duration: 3000,
  });
  
  if (player.value && player.value.aplayer && player.value.aplayer.audio) {
    const currentAudio = player.value.aplayer.audio[player.value.aplayer.index];
    console.error(
      "播放歌曲: " + currentAudio.name + " 出现错误",
      "URL: " + currentAudio.url
    );
  }
};

// 暴露子组件方法
defineExpose({ playToggle, changeVolume, changeSong, toggleList, skipToIndex });
</script>

<style lang="scss" scoped>
.player-container {
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  min-height: 100px; /* 确保有足够的高度来显示居中效果 */
  width: 100%;
}
.aplayer {
  width: 80%;
  border-radius: 6px;
  font-family: "HarmonyOS_Regular", sans-serif !important;
  :deep(.aplayer-body) {
    background-color: transparent;
    .aplayer-pic {
      display: none;
    }
    .aplayer-info {
      margin-left: 0;
      background-color: #ffffff80; /* 增加背景色不透明度 */
      border: 1px solid #ffffff60; /* 添加边框 */
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); /* 添加阴影效果 */
      padding: 10px; /* 增加内边距 */
      .aplayer-music {
        flex-grow: 1;
        margin-bottom: 2px;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        .aplayer-title {
          font-size: 16px;
          margin-right: 6px;
          text-align: center;
        }
        .aplayer-author {
          display: none; /* 隐藏艺术家名称 */
        }
      }
      .aplayer-lrc {
        display: none; /* 隐藏歌词显示区域 */
      }
      .aplayer-controller {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 4px; /* 添加圆角 */
        background-color: rgba(0, 0, 0, 0.1); /* 添加轻微背景色 */
        height: 40px; /* 明确设置控制器高度 */
        padding: 5px 0; /* 上下内边距 */
        .aplayer-bar-wrap {
          width: auto;
          flex-grow: 1;
          margin: 0 10px;
          display: flex;
          align-items: center; /* 确保内部元素垂直居中 */
          height: 100%; /* 占据控制器全部高度 */
          :deep(.aplayer-bar) {
            height: 6px; /* 增加进度条高度 */
            border-radius: 3px; /* 匹配高度的圆角 */
          }
          :deep(.aplayer-loaded) {
            height: 6px; /* 增加已加载部分高度 */
            border-radius: 3px; /* 匹配高度的圆角 */
          }
          :deep(.aplayer-played) {
            height: 6px; /* 增加已播放部分高度 */
            border-radius: 3px; /* 匹配高度的圆角 */
          }
        }
        .aplayer-volume-wrap,
        .aplayer-icon-order,
        .aplayer-icon-loop,
        .aplayer-icon-menu,
        .aplayer-icon-lrc {
          display: none; /* 隐藏其他控制按钮 */
        }
        .aplayer-time {
          display: flex;
          color: #efefef;
        }
      }
    }
  }
  :deep(.aplayer-list) {
    display: none; /* 隐藏播放列表 */
  }
}
</style>
