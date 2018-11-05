const fs = require("fs-extra");
fs.copy("../htz-fronend/htz-frontend/", "/workspace")
  .catch(err => {
    console.error(err);
  })
  .then(() => {
    console.log(4321421);
  });
