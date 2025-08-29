const fs = require('fs');
const path = require('path');

// 读取siteLinks.json文件
const filePath = path.join(__dirname, 'src', 'assets', 'siteLinks.json');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('siteLinks.json 文件内容:');
    console.log(content);
    
    // 尝试解析JSON，验证格式是否正确
    const data = JSON.parse(content);
    console.log('\nJSON解析成功，文件格式正确！');
    console.log('链接总数:', data.length);
    
    // 显示每个链接的详细信息
    console.log('\n链接详情:');
    data.forEach((link, index) => {
        console.log(`${index + 1}. 名称: ${link.name}, 链接: ${link.link}, 图标: ${link.icon}`);
    });
} catch (error) {
    console.error('读取或解析文件时出错:', error.message);
}