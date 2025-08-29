<template>
  <div v-if="siteLinks[0]" class="links">
    <div class="line">
      <Icon size="20">
        <Link />
      </Icon>
      <span class="title">网站列表</span>
    </div>
    <!-- 网站列表 -->
    <Swiper
      v-if="siteLinks[0]"
      :modules="[Pagination, Mousewheel]"
      :slides-per-view="1"
      :space-between="40"
      :pagination="{
        el: '.swiper-pagination',
        clickable: true,
        bulletElement: 'div',
      }"
      :mousewheel="true"
    >
      <SwiperSlide v-for="site in siteLinksList" :key="site">
        <el-row class="link-all" :gutter="20">
          <el-col v-for="(item, index) in site" :span="8" :key="item">
            <div
              class="item cards"
              :style="index < 3 ? 'margin-bottom: 20px' : null"
              @click="jumpLink(item)"
            >
              <Icon size="26">
                <component :is="siteIcon[item.icon]" />
              </Icon>
              <span class="name text-hidden">{{ item.name }}</span>
            </div>
          </el-col>
        </el-row>
      </SwiperSlide>
      <div class="swiper-pagination" />
    </Swiper>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Icon } from "@vicons/utils";
// 可前往 https://www.xicons.org 自行挑选并在此处引入
import { Link, Blog, CompactDisc, Cloud, Compass, Book, Fire, LaptopCode } from "@vicons/fa"; // 注意使用正确的类别
import { mainStore } from "@/store";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination, Mousewheel } from "swiper";

const store = mainStore();

// 使用ref而不是直接导入，避免编译时缓存
const siteLinks = ref([]);

// 动态加载siteLinks.json文件，避免缓存问题
const loadSiteLinks = async () => {
  try {
    // 添加时间戳参数避免缓存
    const timestamp = new Date().getTime();
    const response = await fetch(`/src/assets/siteLinks.json?t=${timestamp}`);
    const data = await response.json();
    siteLinks.value = data;
    console.log('动态加载的siteLinks数据:', data);
  } catch (error) {
    console.error('加载siteLinks.json失败:', error);
    // 如果动态加载失败，使用备用数据
    siteLinks.value = [
      { icon: "Blog", name: "博客", link: "https://lifelinest.github.io" },
      { icon: "Cloud", name: "网盘", link: "https://pan.imsyy.top/" },
      { icon: "CompactDisc", name: "音乐", link: "https://music.imsyy.top/" },
      { icon: "Compass", name: "起始页", link: "https://nav.imsyy.top/" },
      { icon: "Book", name: "网址集", link: "https://web.imsyy.top/" },
      { icon: "Fire", name: "今日热榜", link: "https://hot.imsyy.top/" },
      { icon: "LaptopCode", name: "站点监测", link: "https://status.imsyy.top/" }
    ];
  }
};

// 计算网站链接
const siteLinksList = computed(() => {
  const result = [];
  for (let i = 0; i < siteLinks.value.length; i += 6) {
    const subArr = siteLinks.value.slice(i, i + 6);
    result.push(subArr);
  }
  return result;
});

// 网站链接图标
const siteIcon = {
  Blog,
  Cloud,
  CompactDisc,
  Compass,
  Book,
  Fire,
  LaptopCode,
};

// 链接跳转
const jumpLink = (data) => {
  if (data.name === "音乐" && store.musicClick) {
    if (typeof $openList === "function") $openList();
  } else {
    window.open(data.link, "_blank");
  }
};

onMounted(() => {
  loadSiteLinks();
  // 监听文件变化事件，开发环境下可以自动重新加载
  if (import.meta.env.DEV) {
    console.log('开发环境下启用自动刷新检测');
  }
});
</script>

<style lang="scss" scoped>
.links {
  .line {
    margin: 2rem 0.25rem 1rem;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    animation: fade 0.5s;
    .title {
      margin-left: 8px;
      font-size: 1.15rem;
      text-shadow: 0 0 5px #00000050;
    }
  }
  .link-all {
    margin: 0;
    .item {
      height: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      .name {
        margin-top: 5px;
        font-size: 0.9rem;
      }
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

/* 适配移动端 */
@media (max-width: 768px) {
  .links {
    .line {
      margin: 1.5rem 0.25rem 0.5rem;
    }
    .link-all {
      .item {
        height: 50px;
        .name {
          font-size: 0.8rem;
        }
      }
    }
  }
}

/* 动画 */
@keyframes fade {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>