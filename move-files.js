const fs = require('fs-extra');

async function moveFiles(options, context) {
  const targetDir = 'C:/code/nginx/html/list-project-angular';
  const sourceDir = 'dist/list-project-angular/browser';

  try {
    // 1. 先把目標資料夾清空（保留資料夾，但刪除裡面所有累積的舊檔案）
    await fs.emptyDir(targetDir);

    // 2. 執行複製
    await fs.copy(sourceDir, targetDir, { overwrite: true });

    console.log('前端打包檔案已成功同步，舊檔案已清除！');
  } catch (err) {
    console.error('複製檔案時發生錯誤：', err);
  }
}

moveFiles();
