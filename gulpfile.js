const gulp = require("gulp");
const newer = require("gulp-newer");
const replace = require("gulp-replace");
const debug = require("gulp-debug");
const watch = require("node-watch");
const fs = require("fs");
const rimraf = require("rimraf");

global.libs = [
  { parent: "libs", lib: "app-utils" },
  { parent: "components", lib: "htz-theme" },
  { parent: "components", lib: "htz-components" }
];

global.isWin = process.platform === "win32";
global.slsh = global.isWin ? "\\" : "/";
gulp.task("watch", function() {
  let app = process.argv[3] ? process.argv[3].slice(2) : "haaretz.co.il";

  watch(`${__dirname}/htz/packages/`, { recursive: true }, (evt, name) => {
    let lib = null;
    console.log(name, evt);
    global.libs.map(({ parent, lib: curlib }) => {
      if (name.includes(`${curlib}`)) {
        lib = curlib;
      }
    });

    if (!name.endsWith(".js")) return;

    if (!lib) {
      let newpath = name
        .replace(
          `${global.slsh}htz${global.slsh}`,
          `${global.slsh}dist${global.slsh}`
        )
        .split(global.slsh)
        .slice(0, -1)
        .join(global.slsh);

      gulp
        .src(name)
        .pipe(replaceImprot())
        .pipe(gulp.dest(newpath));
      console.log(newpath);
      return;
    }

    let newpath = name.split(lib)[1].replace(/\\/g, "/");
    newpath = `${__dirname}/dist/packages/apps/${app}/${lib}${newpath}`;

    gulp
      .src(name)
      .pipe(replaceImprot(app))
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
  build("haaretz.co.il");
});

gulp.task("ppage", function() {
  build("purchase-page");
});

function build(app) {
  rimraf(`${__dirname}/dist/packages/apps/${app}`, function() {
    console.log("done deleting");
    global.currentLibs = [...global.libs];
    gulp
      .src([
        __dirname + "/htz/**/*",
        __dirname + "/htz/**/.*",
        `!${__dirname}/htz/node_modules/`,
        `!${__dirname}/htz/node_modules/**`,
        `!${__dirname}/htz/**/node_modules/**`
      ])
      .pipe(newer("dist"))
      .pipe(gulp.dest("dist"))
      .on("finish", () => {
        copyLibs2app(app);
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

function copyLibs2app(app) {
  let { lib, parent } = global.currentLibs.pop();
  console.log(lib);
  openDir(`${lib}`);
  openDir(`${lib}/src`);
  gulp
    .src([
      `${__dirname}/htz/packages/${parent}/${lib}/src/**/*`,
      `${__dirname}/htz/packages/${parent}/${lib}/src/index.js`
    ])
    .pipe(gulp.dest(`${__dirname}/dist/packages/apps/${app}/${lib}/src`))
    .on("finish", () => {
      if (global.currentLibs.length) {
        copyLibs2app(app);
      } else {
        fixImports(app);
      }
    });
}

function fixImports(app) {
  gulp
    .src([`${__dirname}/dist/packages/apps/${app}/**/*.js`])
    .pipe(replaceImprot(app))
    .pipe(gulp.dest(`${__dirname}/dist/packages/apps/${app}`))
    .on("finish", () => {
      global.libs.map(({ lib }) => searchInFiles(`@haaretz/${lib}`));
    });
}

function openDir(dir, app) {
  try {
    if (!fs.existsSync(`${__dirname}/dist/packages/apps/${app}/${dir}`)) {
      fs.mkdirSync(`${__dirname}/dist/packages/apps/${app}/${dir}`);
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

function replaceImprot(app) {
  return replace(
    new RegExp(
      `@haaretz/(${global.libs.map(({ lib }) => lib).join("|")})`,
      "g"
    ),
    `${__dirname.replace(
      /\\/g,
      "\\\\"
    )}/dist/packages/apps/${app}/$1/src/index.js`
  );
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
