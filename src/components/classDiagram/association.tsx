import * as React from 'react';
import * as ReactDOM from 'react-dom';
import IRelationElement from '@interfaces/elements/IRelationElement';
import RelationSegment from './relationSegment';
import RelationDirection from '@enums/relationDirection';
import { useDispatch } from 'react-redux';
import { selectElement } from 'store/actions/canvas';

function Association(props: IRelationElement) {
    const dispatch = useDispatch();
    let segments = props.elementGraphicData.segments.map((segment, index) => {
        return <RelationSegment key={index} {...segment} />
    });

    //to-do UP DOWN in future
    let headDirection = 0;
    if (props.elementGraphicData.direction === RelationDirection.RIGHT) {
        headDirection = -10;
    } else {
        headDirection = 10;
    }

    return (
        <g
            onClick={() => dispatch(selectElement(props.elementData.id))}
        >
            {segments}
            <path stroke='black' d={`M ${props.elementGraphicData.head.x} ${props.elementGraphicData.head.y} l ${headDirection} ${5}`}/>
            <path stroke='black' d={`M ${props.elementGraphicData.head.x} ${props.elementGraphicData.head.y} l ${headDirection} ${-5}`}/>
        </g>
    );
}

export default Association;