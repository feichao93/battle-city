import React from 'react'

export default () => (
  <div className="about">
    <p>
      当前版本 <br />
      {COMPILE_VERSION}
    </p>
    <p>
      编译时间 <br />
      {COMPILE_DATE}
    </p>
    <p>
      游戏仍在开发中，目前只支持单人进行游戏，也包含许多
      <a
        href="https://github.com/shinima/battle-city/issues"
        target="_blank"
        style={{ color: 'red' }}
      >
        BUG
      </a>。 整个游戏都采用了矢量图，请使用最新的 chrome
      浏览器，并适当调整浏览器的缩放比例，以获得最好的游戏体验。
    </p>
    <p className="bold">WASD 控制坦克方向</p>
    <p className="bold">J 控制开火</p>
    <p className="bold">请使用鼠标控制其他部分</p>
  </div>
)
