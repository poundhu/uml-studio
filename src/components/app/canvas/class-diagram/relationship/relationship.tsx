import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useDispatch } from 'react-redux';
import IRelationship from '@interfaces/class-diagram/relationships/IRelationship';
import IRelationshipSegment from '@interfaces/class-diagram/relationships/IRelationshipSegment';
import RelationshipSegment from './relationshipSegment';
import Direction from '@enums/direction';
import { selectNewElement } from '@store/actions/canvas.action';
import ClassDiagramElementsEnum from '@enums/classDiagramElementsEnum';
import Aggregation from '../relationship-heads/aggregation';
import ICoordinates from '@interfaces/ICoordinates';
import Composition from '../relationship-heads/composition';
import Extension from '../relationship-heads/extension';
import Association from '../relationship-heads/association';

const Relationship = (props: { relationship: IRelationship, relationshipSegments: Array<IRelationshipSegment> }) => {
    const dispatch = useDispatch();
    const { relationship, relationshipSegments } = props;

    const segments = relationshipSegments.map((relationshipSegment, index) => {
        return <RelationshipSegment key={index} segment={relationshipSegment} relationId={relationship.id}/>;
    });

    //to-do UP DOWN in future
    let headDirection = 0;
    if (relationship.direction === Direction.RIGHT) {
        headDirection = -10;
    } else {
        headDirection = 10;
    }

    const onSegmentClick = () => {
        dispatch(selectNewElement(relationship.id));
    };

    const relationshipHead = () => {
        const coordinates: ICoordinates = { x: relationship.head.x, y: relationship.head.y };
        switch (relationship.type) {
            case ClassDiagramElementsEnum.AGGREGATION:
                return <Aggregation direction={relationship.direction} coordinates={coordinates}/>;
            case ClassDiagramElementsEnum.COMPOSITION:
                return <Composition direction={relationship.direction} coordinates={coordinates}/>;
            case ClassDiagramElementsEnum.EXTENSION:
                return <Extension direction={relationship.direction} coordinates={coordinates}/>;
            case ClassDiagramElementsEnum.ASSOCIATION:
                return <Association direction={relationship.direction} coordinates={coordinates}/>;
        }
    };

    return (
        <g onClick={(ev) => onSegmentClick()}>
            {segments}
            {relationshipHead()}
        </g>
    );
};

export default Relationship;