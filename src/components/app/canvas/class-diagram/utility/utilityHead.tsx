import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './utility-head.scss';
import IUtilityHead from '@interfaces/class-diagram/utility/IUtilityHead';

const UtilityHead = (props: IUtilityHead) => {
    const { graphicData, data } = props;
    return (
        <g>
            <text className='interface' x={graphicData.title.x} y={graphicData.title.y}>
                {'<<utility>>'}
            </text>
            <text className='interface-name' x={graphicData.text.x} y={graphicData.text.y}>
                {data.text}
            </text>
        </g>
    );
};

export default UtilityHead;