/** @format */

import React from 'react';
import './app.css';
import './app.less';
import appCss from './app.module.css';

function App() {
  return <div className={`app ${appCss.app}`}>Learn React</div>;
}

export default App;
