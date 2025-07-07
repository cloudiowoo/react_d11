#!/usr/bin/env node

import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文件路径
const manifestPath = path.join(__dirname, '../js/.vite/manifest.json');
const librariesPath = path.join(__dirname, '../react.libraries.yml');

try {
  // 读取 manifest.json
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Manifest 文件不存在:', manifestPath);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log('📖 读取 manifest.json 成功');

  // 从 manifest 中提取文件信息
  const entryInfo = manifest['index.html'];
  if (!entryInfo) {
    console.error('❌ 在 manifest 中找不到 index.html 入口');
    process.exit(1);
  }

  const jsFile = entryInfo.file;

  console.log('🔍 发现的文件:');
  console.log('  JS:', jsFile);
  console.log('  CSS: 无 (样式已内联到 JS 中)');

  // 读取现有的 libraries.yml
  if (!fs.existsSync(librariesPath)) {
    console.error('❌ Libraries 文件不存在:', librariesPath);
    process.exit(1);
  }

  const librariesContent = fs.readFileSync(librariesPath, 'utf8');
  const libraries = yaml.load(librariesContent);

  // 更新 react-app 库配置
  if (!libraries['react-app']) {
    libraries['react-app'] = {};
  }

  // 更新版本号（使用当前时间戳）
  const version = Math.floor(Date.now() / 1000);
  libraries['react-app'].version = version;

  // 更新 JS 文件
  libraries['react-app'].js = {
    [`js/${jsFile}`]: {}
  };

  // 移除 CSS 配置（因为样式已内联到 JS 中）
  if (libraries['react-app'].css) {
    delete libraries['react-app'].css;
  }

  // 写入更新后的 libraries.yml
  const updatedYaml = yaml.dump(libraries, {
    indent: 2,
    lineWidth: -1,
    noRefs: true
  });

  fs.writeFileSync(librariesPath, updatedYaml, 'utf8');

  console.log('✅ 成功更新 react.libraries.yml');
  console.log(`📝 新版本号: ${version}`);
  console.log(`📄 JS 文件: js/${jsFile}`);

} catch (error) {
  console.error('❌ 更新失败:', error.message);
  process.exit(1);
}
