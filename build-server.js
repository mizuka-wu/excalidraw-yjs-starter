import { rollup } from 'rollup';
import { loadConfigFile } from 'rollup/dist/loadConfigFile.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载配置文件
loadConfigFile(path.resolve(__dirname, 'rollup.config.js')).then(
  async ({ options, warnings }) => {
    // 打印警告信息
    console.log(`发现${warnings.count}个警告`);
    warnings.flush();

    // 对于配置中的每个选项
    for (const optionsObj of options) {
      const bundle = await rollup(optionsObj);
      await Promise.all(optionsObj.output.map(bundle.write));
    }

    console.log('✅ 构建完成！');
  }
);
