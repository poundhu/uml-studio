import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './app.scss';

import Ribbon from '@components/app/ribbon';
import Canvas from './canvas';
import SideBar from '@components/app/side-bar';

const app = () => {
    return (
        <div id='uml-editor-studio'>
            <Ribbon/>
            <div id='uml-editor-body'>
                <Canvas/>
                <SideBar/>
            </div>
        </div>
    );
};

export default app;