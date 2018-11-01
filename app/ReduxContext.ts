import React from 'react'
import { State } from './reducers'

const ReduxContext = React.createContext<State>(undefined)

export default ReduxContext
