import fs from 'fs';
import path from 'path';

/**
 * 自定义Rollup插件，用于复制next.config.js文件
 * 并确保它作为CommonJS模块被正确导出
 */
export function copyNextConfig() {
  return {
    name: 'copy-next-config',
    writeBundle() {
      try {
        // 读取原始next.config.js
        const nextConfigPath = path.resolve(process.cwd(), 'next.config.js');
        
        // 确保dist目录存在
        const distDir = path.resolve(process.cwd(), 'dist');
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
        
        // 读取next.config.js内容
        let nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
        
        // 确保配置是以CommonJS格式导出的
        // 如果已经是CommonJS格式（使用module.exports），则不需要修改
        // 如果是ESM格式（使用export default），则转换为CommonJS
        if (nextConfigContent.includes('export default')) {
          nextConfigContent = nextConfigContent.replace(
            'export default',
            'module.exports ='
          );
        }
        
        // 写入转换后的next.config.js到dist目录
        fs.writeFileSync(
          path.resolve(distDir, 'next.config.js'),
          nextConfigContent,
          'utf8'
        );
        
        console.log('✅ 已复制并转换next.config.js到dist目录');
      } catch (error) {
        console.error('复制next.config.js时出错:', error);
      }
    }
  };
}
