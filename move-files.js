const fs = require('fs-extra');

async function moveFiles(options, context) {

  await fs.copy('dist/list-project-angular/browser', 'C:/code/nginx/html/list-project-angular', { overwrite: true });
}

moveFiles();