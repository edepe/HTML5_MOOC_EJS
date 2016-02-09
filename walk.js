var folder = process.argv[2];
if(!folder){
  console.log("Uso: node walk.js carpeta");
  return;
}

var fs = require('fs');
var path = require('path');

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

function dirTree(filename, order) {
    var stats = fs.lstatSync(filename);
    var info = {
            path: filename,
            name: path.basename(filename),
            title: ""+order
        };

    if (stats.isDirectory()) {
        info.type = "folder";
        info.title = filename;
        var num = 0;
        info.children = fs.readdirSync(filename).filter(function(boy){
          if(boy.endsWith(".html") || boy.endsWith(".htm") || (fs.lstatSync(filename + '/' + boy).isDirectory()&& boy!=="images" && boy!=="css" && boy!=="javascript" && boy!=="js" && boy!=="fonts" && boy!=="puzzle"  )){
            return true;
          } else{
            return false;
          }
        }).map(function(child) {
            num++;
            return dirTree(filename + '/' + child, num);
        });
    } else {
        // Assuming it's a file. In real life it could be a symlink or
        // something else!
        info.type = "file";
    }

    return info;
}

//var util = require('util');
//console.log(util.inspect(dirTree(folder, 0), false, null));
var outputFilename = folder + '.json';
var myData = dirTree(folder, 0);

fs.writeFile(outputFilename, JSON.stringify(myData.children, null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON salvado a " + outputFilename);
    }
});
