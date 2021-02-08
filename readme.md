# Battle City Remake

Game address: [http://shinima.pw/battle-city/](http://shinima.pw/battle-city/)

Detailed introduction of the game, see the column article: [https://zhuanlan.zhihu.com/p/35551654](https://zhuanlan.zhihu.com/p/35551654)

The version of the GitHub repository is a re-engraved version of the classic tank battle, based on the original material, using React to encapsulate various materials into corresponding components. The material is rendered using SVG to show the pixel style of the game. You can adjust the browser zoom before playing the game. It is best to use 200% zoom under the 1080P screen. This game is developed using web front-end technology, mainly using React for page display, using Immutable.js as a data structure tool library, using redux to manage game state, and using redux-saga/little-saga to handle complex game logic.
If you find any bugs during the game, welcome to mention in [issues](https://github.com/shinima/battle-city/issues/new)。


### Local development

1.  Clone the project to local
2.  Run `yarn install` to install dependencies (or use `npm install`)
3.  Run `yarn start` (or npm start) to start webpack-dev-server, and open `localhost:8080` in the browser.
4.  Run `yarn build` to package the production version, and the packaged output is in the `dist/` folder

`devConfig.js` contains some configuration items for development. Note that you need to restart webpack-dev-server after modifying the configuration in this file