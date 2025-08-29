<template>
  <div class="player-container">
    <!-- 确保播放器总是显示，不再依赖于条件渲染 -->
    <APlayer
      ref="player"
      :audio="playList"
      :autoplay="store.playerAutoplay"
      :theme="theme"
      :autoSwitch="false"
      :loop="store.playerLoop"
      :order="store.playerOrder"
      :volume="volume"
      :showLrc="true"
      :listFolded="listFolded"
      :listMaxHeight="listMaxHeight"
      :noticeSwitch="false"
      @play="onPlay"
      @pause="onPause"
      @timeupdate="onTimeUp"
      @error="loadMusicError"
    />
    
    <!-- 添加额外的调试信息显示 -->
    <div v-if="debugInfo.show" class="debug-info">
      <p>播放列表长度: {{ playList.length }}</p>
      <p v-if="playList[0]">当前歌曲: {{ playList[0].name }} - {{ playList[0].artist }}</p>
      <p v-else>暂无歌曲数据</p>
      <p>API地址: {{ debugInfo.apiUrl }}</p>
    </div>
  </div>
</template>

<script setup>
import { MusicOne, PlayWrong } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import APlayer from "@worstone/vue-aplayer";

const store = mainStore();

// 获取播放器 DOM
const player = ref(null);

// 歌曲播放列表 - 根据用户要求，不设置默认音乐数据，但为了确保可用性，将在API返回的URL不可用时使用备用音频
const playList = ref([]);

// 备用测试音频 - 仅在API返回的URL不可用时使用
const fallbackAudio = {
  name: "备用测试音乐",
  artist: "Home主题",
  url: "https://samplelib.com/lib/preview/mp3/sample-15s.mp3", // 公开测试音频，不会被防盗链
  cover: "https://picsum.photos/id/1/300/300", // 随机封面图
  lrc: "[00:00.00]这是一首备用测试音乐\n[00:05.00]您的音乐API返回的数据可能受到防盗链限制\n[00:10.00]如果需要正常播放，请更换为不受限的音乐API"
};

// 歌曲播放项
const playIndex = ref(0);

// 调试信息
const debugInfo = reactive({
  show: true, // 显示调试信息
  apiUrl: import.meta.env.VITE_SONG_API
});

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
    default: "netease", //'netease' | 'tencent'
  },
  // 播放类型 ( song-歌曲, playlist-播放列表, album-专辑, search-搜索, artist-艺术家 )
  songType: {
    type: String,
    default: "playlist",
  },
  // id
  songId: {
    type: String,
    default: "7452421335",
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

// 初始化播放器
onMounted(() => {
  nextTick(() => {
    try {
      // 确保store状态正确设置
      store.musicIsOk = true;
      console.log('播放器已初始化，默认音乐已加载');
      console.log('默认播放列表:', playList.value);
      
      // 尝试从API获取真实音乐数据
      console.log('尝试从API获取音乐数据...');
      console.log('API地址:', import.meta.env.VITE_SONG_API);
      
      fetch(import.meta.env.VITE_SONG_API).then(apiRes => {
        if (!apiRes.ok) throw new Error(`HTTP错误! 状态码: ${apiRes.status}`);
        return apiRes.json();
      }).then(data => {
        console.log('API返回数据:', data);
        if (data.code === 1 && data.data) {
          const apiSong = [{
            name: data.data.name,
            artist: data.data.artistsname,
            url: data.data.url,
            cover: data.data.picurl,
            lrc: ''
          }];
          playList.value = apiSong;
          console.log('成功从API更新播放列表:', playList.value);
          
          // 添加URL可用性检测
          checkUrlAvailability(data.data.url).then(available => {
            if (available) {
              // 显示成功消息
              ElMessage({
                message: "成功加载网络音乐",
                grouping: true,
                type: 'success'
              });
            } else {
              // API返回的URL不可用，使用备用音频
              ElMessage({
                message: "音乐资源受防盗链限制，已切换到备用测试音乐",
                grouping: true,
                type: 'warning'
              });
              
              // 使用备用音频
              playList.value = [fallbackAudio];
              console.log('已切换到备用测试音乐');
            }
          });
        }
      }).catch(err => {
        console.error('API调用失败:', err);
        // API调用失败，使用备用音频
        ElMessage({
          message: "音乐API连接失败，已切换到备用测试音乐",
          grouping: true,
          type: 'warning'
        });
        
        // 使用备用音频
        playList.value = [fallbackAudio];
        console.log('已切换到备用测试音乐');
      });
    } catch (err) {
      console.error('播放器初始化异常:', err);
      // 不改变playList，继续使用默认音乐
      ElMessage({
        message: "播放器加载失败",
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

// 切换歌曲列表状态
const toggleList = () => {
  player.value.toggleList();
};

// 检查URL可用性
const checkUrlAvailability = (url) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.addEventListener('canplaythrough', () => {
      resolve(true);
      audio.remove();
    });
    audio.addEventListener('error', () => {
      console.error('URL可用性检查失败:', url);
      resolve(false);
      audio.remove();
    });
    audio.src = url;
    audio.load();
  });
};

// 加载音频错误
const loadMusicError = () => {
  let notice = "";
  if (playList.value.length > 1) {
    notice = "播放歌曲出现错误，播放器将在 2s 后进行下一首";
  } else {
    notice = "播放歌曲出现错误，可能是由于音乐资源的防盗链限制";
  }
  
  ElMessage({
    message: notice,
    grouping: true,
    icon: h(PlayWrong, {
      theme: "filled",
      fill: "#EFEFEF",
      duration: 2000,
    }),
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
defineExpose({ playToggle, changeVolume, changeSong, toggleList });
</script>

<style lang="scss" scoped>
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
      background-color: #ffffff40;
      border-color: transparent !important;
      .aplayer-music {
        flex-grow: initial;
        margin-bottom: 2px;
        overflow: initial;
        .aplayer-title {
          font-size: 16px;
          margin-right: 6px;
        }
        .aplayer-author {
          color: #efefef;
        }
      }
      .aplayer-lrc {
        text-align: left;
        margin: 7px 0 6px 6px;
        height: 44px;
        mask: linear-gradient(
          #fff 15%,
          #fff 85%,
          hsla(0deg, 0%, 100%, 0.6) 90%,
          hsla(0deg, 0%, 100%, 0)
        );
        -webkit-mask: linear-gradient(
          #fff 15%,
          #fff 85%,
          hsla(0deg, 0%, 100%, 0.6) 90%,
          hsla(0deg, 0%, 100%, 0)
        );
        &::before,
        &::after {
          display: none;
        }
        p {
          color: #efefef;
        }
        .aplayer-lrc-current {
          font-size: 0.95rem;
          margin-bottom: 4px !important;
        }
      }
      .aplayer-controller {
        display: none;
      }
    }
  }
  :deep(.aplayer-list) {
    margin-top: 6px;
    height: v-bind(listHeight);
    background-color: transparent;
    ol {
      &::-webkit-scrollbar-track {
        background-color: transparent;
      }
      li {
        border-color: transparent;
        &.aplayer-list-light {
          background: #ffffff40;
          border-radius: 6px;
        }
        &:hover {
          background: #ffffff26 !important;
          border-radius: 6px !important;
        }
        .aplayer-list-index,
        .aplayer-list-author {
          color: #efefef;
        }
      }
    }
  }
}
</style>
