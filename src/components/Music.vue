<template>
  <!-- 音乐控制面板 -->
  <div
    class="music"
    @mouseenter="volumeShow = true"
    @mouseleave="volumeShow = false"
    v-show="store.musicOpenState"
  >
    <div class="btns">
      <span @click="openMusicList()">音乐列表</span>
      <span @click="store.musicOpenState = false">回到一言</span>
    </div>
    <div class="control">
      <go-start theme="filled" size="30" fill="#efefef" @click="changeMusicIndex(0)" />
      <div class="state" @click="changePlayState">
        <play-one theme="filled" size="50" fill="#efefef" v-show="!store.playerState" />
        <pause theme="filled" size="50" fill="#efefef" v-show="store.playerState" />
      </div>
      <go-end theme="filled" size="30" fill="#efefef" @click="changeMusicIndex(1)" />
    </div>
    <div class="menu">
      <div class="name" v-show="!volumeShow">
        <span>{{
          store.getPlayerData.name
            ? store.getPlayerData.name + " - " + store.getPlayerData.artist
            : "未播放音乐"
        }}</span>
      </div>
      <div class="volume" v-show="volumeShow">
        <div class="icon">
          <volume-mute theme="filled" size="24" fill="#efefef" v-if="volumeNum == 0" />
          <volume-small
            theme="filled"
            size="24"
            fill="#efefef"
            v-else-if="volumeNum > 0 && volumeNum < 0.7"
          />
          <volume-notice theme="filled" size="24" fill="#efefef" v-else />
        </div>
        <el-slider v-model="volumeNum" :show-tooltip="false" :min="0" :max="1" :step="0.01" />
      </div>
    </div>
  </div>
  <!-- 音乐列表弹窗 -->
  <Transition name="fade" mode="out-in">
    <div class="music-list" v-show="musicListShow" @click="closeMusicList()">
      <Transition name="zoom">
        <div class="list" v-show="musicListShow" @click.stop>
          <!-- 移除了关闭按钮 -->
          <div class="music-list-header">
            <h3>我的音乐列表</h3>
            <span class="music-count">{{ store.getMusicList.length }} 首音乐</span>
          </div>
          <div class="music-list-content">
            <div class="music-detail-player">
              <Player
                ref="playerRef"
                :songServer="playerData.server"
                :songType="playerData.type"
                :songId="playerData.id"
                :volume="volumeNum"
                :listFolded="true"
              />
            </div>
            <div class="music-list-items">
              <div class="music-item-header">
                <span class="index">序号</span>
                <span class="title">标题</span>
                <span class="artist">艺术家</span>
                <span class="action">操作</span>
              </div>
              <div class="music-items">
                <div 
                  v-for="(item, index) in store.getMusicList" 
                  :key="index"
                  class="music-item" 
                  :class="{ active: store.currentMusicIndex === index }"
                  @click="playMusic(index)"
                >
                  <span class="index">{{ index + 1 }}</span>
                  <span class="title">{{ item.name }}</span>
                  <span class="artist">{{ item.artist }}</span>
                  <div class="action">
                    <play-one 
                      v-if="store.currentMusicIndex !== index || !store.playerState" 
                      theme="filled" 
                      size="20" 
                      fill="#efefef" 
                      class="play-btn"
                    />
                    <pause-one 
                      v-else 
                      theme="filled" 
                      size="20" 
                      fill="#efefef" 
                      class="pause-btn"
                      @click.stop="pauseMusic"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import {
  GoStart,
  PlayOne,
  PauseOne,
  Pause,
  GoEnd,
  CloseOne,
  VolumeMute,
  VolumeSmall,
  VolumeNotice,
} from "@icon-park/vue-next";
import Player from "@/components/Player.vue";
import { mainStore } from "@/store";

import localMusicConfig from '@/assets/localMusic.json';
const store = mainStore();

// 音量条数据
const volumeShow = ref(false);
const volumeNum = ref(store.musicVolume ? store.musicVolume : 0.7);

// 播放列表数据
const musicListShow = ref(false);
const playerRef = ref(null);
const playerData = reactive({
  server: import.meta.env.VITE_SONG_SERVER,
  type: import.meta.env.VITE_SONG_TYPE,
  id: import.meta.env.VITE_SONG_ID,
});

// 开启播放列表
const openMusicList = () => {
  musicListShow.value = true;
};

// 关闭播放列表
const closeMusicList = () => {
  musicListShow.value = false;
};

// 音乐播放暂停
const changePlayState = () => {
  playerRef.value.playToggle();
};

// 音乐上下曲
const changeMusicIndex = (type) => {
  playerRef.value.changeSong(type);
};

onMounted(() => {
  // 空格键事件
  window.addEventListener("keydown", (e) => {
    if (!store.musicIsOk) {
      return ;
    }
    if (e.code == "Space") {
      changePlayState();
    }
  });
  // 挂载方法至 window
  window.$openList = openMusicList;
  
  // 初始化时同步本地音乐列表到store
  if (localMusicConfig && localMusicConfig.musicList) {
    store.setMusicList(localMusicConfig.musicList);
  }
});

// 播放指定的音乐
const playMusic = (index) => {
  if (playerRef.value && store.getMusicList[index]) {
    store.currentMusicIndex = index;
    // 触发播放
    playerRef.value.skipToIndex(index);
    playerRef.value.playToggle();
  }
};

// 暂停音乐播放
const pauseMusic = () => {
  if (playerRef.value) {
    playerRef.value.playToggle();
  }
};



// 监听音量变化
watch(
  () => volumeNum.value,
  (value) => {
    store.musicVolume = value;
    playerRef.value.changeVolume(store.musicVolume);
  },
);
</script>

<style lang="scss" scoped>
.music {
  width: 100%;
  height: 100%;
  background: #00000040;
  backdrop-filter: blur(10px);
  border-radius: 6px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  animation: fade 0.5s;
  .btns {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    span {
      background: #ffffff26;
      padding: 2px 8px;
      border-radius: 6px;
      margin: 0px 6px;
      text-overflow: ellipsis;
      overflow-x: hidden;
      white-space: nowrap;
      &:hover {
        background: #ffffff4d;
      }
    }
  }
  .control {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    width: 100%;
    .state {
      .i-icon {
        width: 50px;
        height: 50px;
        display: block;
      }
    }
    .i-icon {
      width: 36px;
      height: 36px;
      display: flex;
      border-radius: 6px;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transform: scale(1);
      &:hover {
        background: #ffffff33;
      }
      &:active {
        transform: scale(0.95);
      }
    }
  }
  .menu {
    height: 26px;
    width: 100%;
    line-height: 26px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    .name {
      width: 100%;
      text-align: center;
      text-overflow: ellipsis;
      overflow-x: hidden;
      white-space: nowrap;
      animation: fade 0.3s;
    }
    .volume {
      width: 100%;
      padding: 0 12px;
      display: flex;
      align-items: center;
      flex-direction: row;
      animation: fade 0.3s;
      .icon {
        margin-right: 12px;
        span {
          width: 24px;
          height: 24px;
          display: block;
        }
      }
      :deep(*) {
        transition: none;
      }
      :deep(.el-slider__button) {
        transition: 0.3s;
      }
      .el-slider {
        margin-right: 12px;
        --el-slider-main-bg-color: #efefef;
        --el-slider-runway-bg-color: #ffffff40;
        --el-slider-button-size: 16px;
      }
    }
  }
}
.music-list {
  position: fixed;
  top: 0;
  left: 0;
  margin: auto;
  width: 100%;
  height: 100%;
  background-color: #00000080;
  backdrop-filter: blur(20px);
  z-index: 1;
  .list {
    position: absolute;
    top: calc(50% - 300px);
    left: calc(50% - 320px);
    width: 640px;
    height: 600px;
    background-color: #ffffff66;
    border-radius: 6px;
    z-index: 999;
    @media (max-width: 720px) {
      left: calc(50% - 45%);
      width: 90%;
      top: 10%;
      height: 80%;
    }
    .close {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 28px;
      height: 28px;
      display: block;
      &:hover {
        transform: scale(1.2);
      }
      &:active {
        transform: scale(0.95);
      }
    }
    .music-list-header {
      position: absolute;
      top: 20px;
      left: 20px;
      width: calc(100% - 40px);
      display: flex;
      justify-content: space-between;
      align-items: center;
      h3 {
        color: #efefef;
        margin: 0;
        font-size: 18px;
      }
      .music-count {
        color: #efefef80;
        font-size: 14px;
      }
    }
    .music-list-content {
      width: 100%;
      height: 100%;
      padding: 70px 20px 20px 20px;
      display: flex;
      flex-direction: column;
      .music-detail-player {
        margin-bottom: 16px;
        .aplayer {
          width: 100%;
        }
      }
      .music-list-items {
        flex: 1;
        overflow: hidden;
        background-color: #ffffff26;
        border-radius: 6px;
        .music-item-header {
          display: flex;
          padding: 12px 20px;
          background-color: #ffffff40;
          color: #efefef;
          font-size: 14px;
          border-bottom: 1px solid #ffffff26;
          .index {
            width: 30px;
            text-align: center;
          }
          .title {
            flex: 1;
            margin-left: 20px;
          }
          .artist {
            width: 120px;
            text-align: center;
          }
          .action {
            width: 40px;
            text-align: center;
          }
        }
        .music-items {
          height: calc(100% - 45px);
          overflow-y: auto;
          &::-webkit-scrollbar {
            width: 6px;
          }
          &::-webkit-scrollbar-track {
            background: transparent;
          }
          &::-webkit-scrollbar-thumb {
            background: #ffffff40;
            border-radius: 3px;
          }
          &::-webkit-scrollbar-thumb:hover {
            background: #ffffff66;
          }
          .music-item {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            color: #efefef;
            cursor: pointer;
            transition: background-color 0.3s;
            &:hover {
              background-color: #ffffff33;
            }
            &.active {
              background-color: #ffffff4d;
            }
            .index {
              width: 30px;
              text-align: center;
              color: #efefef80;
            }
            .title {
              flex: 1;
              margin-left: 20px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .artist {
              width: 120px;
              text-align: center;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              color: #efefef80;
            }
            .action {
              width: 40px;
              text-align: center;
            }
          }
        }
      }
    }
  }
}

// 弹窗动画
.zoom-enter-active {
  animation: zoom 0.4s ease-in-out;
}
.zoom-leave-active {
  animation: zoom 0.3s ease-in-out reverse;
}
@keyframes zoom {
  0% {
    opacity: 0;
    transform: scale(0) translateY(-600px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
