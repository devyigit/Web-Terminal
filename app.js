const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

let currentDir = path.join(__dirname, 'files');

if (!fs.existsSync(currentDir)) {
  fs.mkdirSync(currentDir);
}

let installedPackages = [];
let nodeModulesDir = path.join(currentDir, 'node_modules');

if (!fs.existsSync(nodeModulesDir)) {
  fs.mkdirSync(nodeModulesDir);
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/run', (req, res) => {
  const command = req.body.command.split(' ');
  const cmd = command[0];
  const arg = command.slice(1).join(' ');

  if (cmd === 'ls') {
    fs.readdir(currentDir, { withFileTypes: true }, (err, files) => {
      if (err) {
        res.json({ output: 'Error reading directory' });
      } else {
        const fileList = files.map(file => file.isDirectory() ? `[DIR] ${file.name}` : file.name);
        res.json({ output: fileList.join('\n') || 'No files or directories' });
      }
    });
  } else if (cmd === 'mkdir') {
    const folderName = arg;
    if (folderName) {
      const folderPath = path.join(currentDir, folderName);
      fs.mkdir(folderPath, { recursive: true }, (err) => {
        if (err) {
          res.json({ output: 'Error creating directory' });
        } else {
          res.json({ output: `${folderName} directory created` });
        }
      });
    } else {
      res.json({ output: 'Folder name is required' });
    }
  } else if (cmd === 'touch') {
    const fileName = arg;
    if (fileName) {
      const filePath = path.join(currentDir, fileName);
      fs.writeFile(filePath, '', (err) => {
        if (err) {
          res.json({ output: 'Error creating file' });
        } else {
          res.json({ output: `${fileName} file created` });
        }
      });
    } else {
      res.json({ output: 'File name is required' });
    }
  } else if (cmd === 'rm') {
    const target = arg;
    if (target) {
      const targetPath = path.join(currentDir, target);
      fs.stat(targetPath, (err, stats) => {
        if (err) {
          res.json({ output: 'File or directory not found' });
        } else {
          if (stats.isDirectory()) {
            fs.rmdir(targetPath, { recursive: true }, (err) => {
              if (err) {
                res.json({ output: 'Error deleting directory' });
              } else {
                res.json({ output: `${target} directory deleted` });
              }
            });
          } else {
            fs.unlink(targetPath, (err) => {
              if (err) {
                res.json({ output: 'Error deleting file' });
              } else {
                res.json({ output: `${target} file deleted` });
              }
            });
          }
        }
      });
    } else {
      res.json({ output: 'Target is required' });
    }
  } else if (cmd === 'pwd') {
    res.json({ output: currentDir });
  } else if (cmd === 'cd') {
    const targetDir = arg;
    const newDir = path.join(currentDir, targetDir);
    if (fs.existsSync(newDir) && fs.lstatSync(newDir).isDirectory()) {
      currentDir = newDir;
      res.json({ output: `Directory changed to ${currentDir}` });
    } else {
      res.json({ output: 'Directory not found' });
    }
  } else if (cmd === 'cat') {
    const fileName = arg;
    const filePath = path.join(currentDir, fileName);
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          res.json({ output: 'Error reading file' });
        } else {
          res.json({ output: data });
        }
      });
    } else {
      res.json({ output: 'File not found' });
    }
  } else if (cmd === 'pkg') {
    const packageName = arg;
    if (packageName === 'install nodejs') {
      if (!installedPackages.includes('nodejs')) {
        installedPackages.push('nodejs');
        res.json({ output: 'Node.js successfully installed' });
      } else {
        res.json({ output: 'Node.js is already installed' });
      }
    } else {
      res.json({ output: `Package ${packageName} not found` });
    }
  } else if (cmd === 'help') {
    res.json({ output: `Available commands: ls, mkdir, touch, rm, pwd, cd, cat, pkg, help, github, contact` });
  } else if (cmd === 'github') {
    res.json({ output: `https://github.com/devyigit/Web-Terminal` });
  } else if (cmd === 'contact') {
    res.json({ output: `Contact Me: yigitkabak05@hotmail.com` });
  } else if (cmd === 'node') {
    if (installedPackages.includes('nodejs')) {
      exec(`node ${arg}`, (error, stdout, stderr) => {
        if (error) {
          res.json({ output: `Error: ${stderr}` });
        } else {
          res.json({ output: stdout });
        }
      });
    } else {
      res.json({ output: 'Node.js is not installed. Run "pkg install nodejs" first.' });
    }
  } else if (cmd === 'npm' && command[1] === 'install') {
    const packageName = command[2];
    if (packageName) {
      const packagePath = path.join(nodeModulesDir, packageName);
      if (!fs.existsSync(packagePath)) {
        fs.mkdirSync(packagePath);
        fs.writeFileSync(path.join(packagePath, 'package.json'), `{"name": "${packageName}", "version": "1.0.0"}`);
        res.json({ output: `${packageName} installed successfully.` });
      } else {
        res.json({ output: `${packageName} is already installed.` });
      }
    } else {
      res.json({ output: 'Package name is required.' });
    }
  } else if (cmd === 'npm' && command[1] === 'list') {
    fs.readdir(nodeModulesDir, (err, files) => {
      if (err || files.length === 0) {
        res.json({ output: 'No packages installed.' });
      } else {
        res.json({ output: files.join('\n') });
      }
    });
  } else {
    res.json({ output: `${cmd}: command not found` });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
