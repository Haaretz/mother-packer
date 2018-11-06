## Mother Packer

Pack the htz-component and the app-utils to the current working app for fast automatic builds

instructions

run the folowwings

1. git clone --recurse-submodules git@github.com:Haaretz/htz-frontend.git htz
2. npm i
3. gulp
4. cd dist
5. yarn && yarn bootstrap && HOSTNAME=local yarn workspace @haaretz/haaretz.co.il dev

open another shell

6. switch to the project folder (htz)
7. yarn
8. gulp watch
9. open the project with the browser http://local.haaretz.co.il:3000/{articleid}

Now the htz folder in the project is your working environment.
You can edit it and see the chanes apply live
