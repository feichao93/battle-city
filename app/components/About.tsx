import classNames from 'classnames'
import React from 'react'
import { Route, Switch } from 'react-router-dom'

const AboutGallery = () => (
  <div>
    <p>Please use the mouse to operate this page.</p>
  </div>
)

const AboutList = () => (
  <div>
    <p>Please use the mouse to operate this page. There will be a freeze when switching tabs, please be patient.</p>
    <p>The custom level data will be saved in the browser cache.</p>
  </div>
)

const AboutEditor = () => (
  <div>
    <p>Please use the mouse to operate this page.</p>
    <p>
Configure the name and enemy of the level in the config tab. Note that the name of the level cannot be the same as the name of the game's own level.</p>
    <p>
    On the map tab
    Configure the level map in, after selecting a brush, press the mouse and drag in the map to complete the map configuration. brick-wall and
    The shape of the steel-wall can be adjusted.
    </p>
  </div>
)

const AboutGame = () => (
  <div>
    <p>
      <b>ESC</b>
      ：Pause the game
      <br />
      <b>Back</b>
      ：Return to the level selection page
    </p>
    <p> Player one
      <br />
      <b>WASD</b>
      ：control direction
      <br />
      <b>J</b>
      ：Control fire
    </p>
    <p>
      Player two
      <br />
      <b>Arrow keys</b>
      ：control direction
      <br />
      <b>/</b>
      ：Control fire
    </p>
  </div>
)

const AboutChoose = () => (
  <div>
    <p className="bold">A Previous level</p>
    <p className="bold">D Next level</p>
    <p className="bold">J Start the game</p>
    <p>This page also supports mouse control</p>
  </div>
)

const AboutTitle = () => (
  <div>
    <p>
    Please use the latest chrome browser and adjust the zoom ratio of the browser appropriately (set to 200% under 1080P
    Zoom) to get the best gaming experience.
    </p>
    <p className="bold">W Previous option</p>
    <p className="bold">S Next option</p>
    <p className="bold">J determine</p>
    <p>This page also supports mouse control</p>
  </div>
)

export default class About extends React.Component {
  state = { hide: false }

  onHide = () => {
    this.setState({ hide: true })
  }

  render() {
    const { hide } = this.state
    return (
      <div className={classNames('about', { hide })}>
        <button className="close" onClick={this.onHide}>
          hide
        </button>
        <p>
          current version <br />
          {COMPILE_VERSION}
        </p>
        <p>
          Compile time <br />
          {COMPILE_DATE}
        </p>
        <Switch>
          <Route path="/list" render={AboutList} />
          <Route path="/editor" render={AboutEditor} />
          <Route path="/gallery" render={AboutGallery} />
          <Route exact path="/gameover" render={AboutGame} />
          <Route path="/choose" render={AboutChoose} />
          <Route path="/stage" render={AboutGame} />
          <Route render={AboutTitle} />
        </Switch>
      </div>
    )
  }
}
