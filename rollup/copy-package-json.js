import fs from 'fs';
import path from 'path';

/**
 * 自定义Rollup插件，用于复制package.json文件，
 * 但只提取name, version和dependencies字段
 */
export function copyPackageJson() {
  return {
    name: 'copy-package-json',
    writeBundle() {
      try {
        // 读取原始package.json
        const packageJsonPath = path.resolve(process.cwd(), 'package.json');
        const packageLockPath = path.resolve(process.cwd(), 'package-lock.json');
        
        // 确保dist目录存在
        const distDir = path.resolve(process.cwd(), 'dist');
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
        
        // 读取并解析package.json
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // 只提取需要的字段
        const simplifiedPackageJson = {
          name: packageJson.name,
          version: packageJson.version,
          dependencies: packageJson.dependencies
        };
        
        // 写入简化后的package.json到dist目录
        fs.writeFileSync(
          path.resolve(distDir, 'package.json'),
          JSON.stringify(simplifiedPackageJson, null, 2),
          'utf8'
        );
        
        console.log('✅ 已复制简化的package.json到dist目录');
        
        // 如果存在package-lock.json，也复制它
        if (fs.existsSync(packageLockPath)) {
          fs.copyFileSync(
            packageLockPath,
            path.resolve(distDir, 'package-lock.json')
          );
          console.log('✅ 已复制package-lock.json到dist目录');
        }
      } catch (error) {
        console.error('复制package.json时出错:', error);
      }
    }
  };
}
