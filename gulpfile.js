const gulp = require("gulp");
const newer = require("gulp-newer");
const replace = require("gulp-replace");
const debug = require("gulp-debug");
const watch = require("node-watch");
const fs = require("fs");
const rimraf = require("rimraf");

global.libs = [
  { parent: "libs", lib: "app-utils" },
  { parent: "components", lib: "htz-components" }
];

gulp.task("watch", function() {
  watch(`${__dirname}/htz/packages/`, { recursive: true }, (evt, name) => {
    let lib = null;
    console.log(name, evt);
    global.libs.map(({ parent, lib: curlib }) => {
      if (name.includes(`${curlib}`)) {
        lib = curlib;
      }
    });
    if (!lib || !name.endsWith(".js")) return;

    let newpath = name.split(lib)[1].replace(/\\/g, "/");
    newpath = `${__dirname}/dist/packages/apps/haaretz.co.il/${lib}${newpath}`;

    gulp
      .src(name)
      .pipe(
        replace(
          new RegExp(
            `@haaretz/(${global.libs.map(({ lib }) => lib).join("|")})`,
            "g"
          ),
          `${__dirname.replace(
            /\\/g,
            "\\\\"
          )}/dist/packages/apps/haaretz.co.il/$1/src/index.js`
        )
      )

      .pipe(
        gulp.dest(
          newpath
            .split("/")
            .slice(0, -1)
            .join("/")
        )
      );

    console.log(newpath);
  });
});

gulp.task("default", function() {
  build();
});

function build() {
  rimraf(`${__dirname}/dist/packages/apps/haaretz.co.il`, function() {
    console.log("done deleting");
    global.currentLibs = [...global.libs];
    gulp
      .src([__dirname + "/htz/**/*", __dirname + "/htz/**/.*"])
      .pipe(newer("dist"))
      .pipe(gulp.dest("dist"))
      .on("finish", () => {
        copyLibs2app();
      });
  });
}

function copyFelaMonolitic() {
  gulp
    .src([__dirname + "/SuperFela.js"])
    .pipe(
      gulp.dest(
        `${__dirname}/dist/packages/apps/haaretz.co.il/htz-components/src/components/SuperFela`
      )
    );
}

function copyLibs2app() {
  let { lib, parent } = global.currentLibs.pop();
  console.log(lib);
  openDir(`${lib}`);
  openDir(`${lib}/src`);
  gulp
    .src([
      `${__dirname}/htz/packages/${parent}/${lib}/src/**/*`,
      `${__dirname}/htz/packages/${parent}/${lib}/src/index.js`
    ])
    .pipe(gulp.dest(`${__dirname}/dist/packages/apps/haaretz.co.il/${lib}/src`))
    .on("finish", () => {
      if (global.currentLibs.length) {
        copyLibs2app();
      } else {
        fixImports();
      }
    });
}

function fixImports() {
  setTimeout(() => {
    gulp
      .src([__dirname + "/dist/packages/apps/haaretz.co.il/**/*.js"])
      .pipe(
        replace(
          new RegExp(
            `@haaretz/(${global.libs.map(({ lib }) => lib).join("|")})`,
            "g"
          ),
          `${__dirname.replace(
            /\\/g,
            "\\\\"
          )}/dist/packages/apps/haaretz.co.il/$1/src/index.js`
        )
      )

      .pipe(gulp.dest(__dirname + "/dist/packages/apps/haaretz.co.il"))
      .on("finish", () => {
        global.libs.map(({ lib }) => searchInFiles(`@haaretz/${lib}`));
      });
  }, 5000);
}

function openDir(dir) {
  try {
    if (
      !fs.existsSync(`${__dirname}/dist/packages/apps/haaretz.co.il/${dir}`)
    ) {
      fs.mkdirSync(`${__dirname}/dist/packages/apps/haaretz.co.il/${dir}`);
    }
  } catch {}
}

function walkSync(dir, filelist) {
  var fs = fs || require("fs"),
    files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + "/" + file).isDirectory()) {
      filelist = walkSync(dir + "/" + file, filelist);
    } else {
      filelist.push(dir + "/" + file);
    }
  });
  return filelist;
}

function searchInFiles(
  term,
  path = `${__dirname}/dist/packages/apps/haaretz.co.il`
) {
  var list = walkSync(path);
  list.map(file => {
    fs.readFile(file, "utf8", (err, data) => {
      if (file.split(".").slice(-1)[0] === "js" && data.indexOf(term) > -1) {
        console.log(term);
        console.log(file);
      }
    });
  });
}
