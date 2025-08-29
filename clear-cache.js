// 清除PWA缓存和分析问题的脚本
const fs = require('fs');
const path = require('path');

console.log('分析直接修改文件后刷新没有效果的原因：\n');

// 1. 检查siteLinks.json文件是否存在并显示内容
const siteLinksPath = path.join(__dirname, 'src', 'assets', 'siteLinks.json');
if (fs.existsSync(siteLinksPath)) {
    try {
        const content = fs.readFileSync(siteLinksPath, 'utf8');
        const siteLinks = JSON.parse(content);
        console.log('✓ siteLinks.json文件存在且格式正确');
        console.log('当前博客链接:', siteLinks[0]?.link || '未找到');
    } catch (error) {
        console.error('✗ 解析siteLinks.json文件出错:', error.message);
    }
} else {
    console.error('✗ siteLinks.json文件不存在');
}

// 2. 分析可能的原因
console.log('\n可能的原因分析：');
console.log('1. PWA缓存机制：项目是一个Progressive Web App，使用了service worker，可能会缓存网站资源');
console.log('   - service worker会缓存静态资源，包括JSON文件');
console.log('   - 即使修改了源文件，浏览器可能仍然加载缓存的版本');

console.log('2. Vite开发服务器缓存：在开发模式下，Vite可能会对某些资源进行缓存');
console.log('3. 导入方式：组件直接从@/assets/siteLinks.json导入数据');

// 3. 提供解决方案
console.log('\n解决方案：');
console.log('1. 在浏览器中清除站点数据（推荐）：');
console.log('   - Chrome: F12 > 应用 > 存储 > 清除站点数据');
console.log('   - Firefox: F12 > 存储 > 清除所有数据');

console.log('2. 修改代码以避免缓存问题：');
console.log('   - 将静态JSON导入改为动态加载（如通过fetch请求）');
console.log('   - 在开发环境中添加版本号参数');

console.log('\n建议操作：');
console.log('1. 停止当前的开发服务器');
console.log('2. 清除浏览器缓存和站点数据');
console.log('3. 重新启动开发服务器');
console.log('4. 使用无痕模式测试（自动禁用缓存）');