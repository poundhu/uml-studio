import { useDispatch, useSelector } from 'react-redux';
import ICoordinates from '@interfaces/ICoordinates';
import CanvasOperationEnum from '@enums/canvasOperationEnum';
import ClassDiagramElementsEnum from '@enums/classDiagramElementsEnum';
import Direction from '@enums/direction';
import IObject from '@interfaces/class-diagram/object/IObject';
import IClass from '@interfaces/class-diagram/class/IClass';
import IUtility from '@interfaces/class-diagram/utility/IUtility';
import IPrimitiveType from '@interfaces/class-diagram/primitive-type/IPrimitiveType';
import IInterface from '@interfaces/class-diagram/interface/IInterface';
import IEnumeration from '@interfaces/class-diagram/enumeration/IEnumeration';
import IDataType from '@interfaces/class-diagram/data-type/IDataType';
import { isMouseDown } from '@store/actions/canvas.action';
import { updateRelationshipEndingHelper, updateRelationshipHelper, createNewRelationship, updateRelationshipStartingHelper } from '@utils/elements/relationship';
import IStoreState from '@interfaces/IStoreState';
import IClassDiagramState from '@interfaces/class-diagram/IClassDiagramState';
import IBaseElement from '@interfaces/class-diagram/common/IBaseElement';
import ICanvasOperation from '@interfaces/ICanvasOperation';
import { resizeFrame } from '@utils/elements/frame';
import { moveClass } from '@utils/elements/class';
import { moveUtility } from '@utils/elements/utility';
import { movePrimitiveType } from '@utils/elements/primitiveType';
import { moveInterface } from '@utils/elements/interface';
import { moveEnumeration } from '@utils/elements/enumeration';
import { moveDataType } from '@utils/elements/dataType';
import { moveObject } from '@utils/elements/object';
import { updateElement, updateNewRelationship, updateRelationshipSegment, addNewRelationshipSegment, updateRelationship } from '@store/actions/classDiagram.action';
import useCanvasOperation from './useCanvasOperation';
import useCanvasDefaultRelationshipType from './useCanvasDefaultRelationshipType';
import IStateDiagramState from '@interfaces/state-diagram/IStateDiagramState';
import StateDiagramElementsEnum from '@enums/stateDiagramElementsEnum';
import { updateStateElement, updateInitialStateElement, updateFinalStateElement, updateForkJoinElement, updateChoiceElement } from '@store/actions/stateDiagram.action';
import IStateElement from '@interfaces/state-diagram/state/IStateElement';
import { moveStateElement, moveInitialStateElement, moveFinalStateElement } from '@utils/elements/stateElement';
import ClassDiagramRelationshipTypesEnum from '@enums/classDiagramRelationshipTypesEnum';
import IInitialStateElement from '@interfaces/state-diagram/initial-state/IInitialStateElement';
import IFinalStateElement from '@interfaces/state-diagram/final-state/IFinalStateElement';
import { moveForkJoinElement } from '@utils/elements/forkJoin';
import IForkJoinElement from '@interfaces/state-diagram/IForkJoinElement';
import { moveChoiceElement } from '@utils/elements/choice';
import IChoiceElement from '@interfaces/state-diagram/IChoiceElement';

const useCanvasMouseMove = (
    classDiagram: IClassDiagramState,
    stateDiagram: IStateDiagramState,
    canvasOperation: ICanvasOperation
) => {
    const dispatch = useDispatch();
    const { canvasDefaultRelationshipType } = useCanvasDefaultRelationshipType();
    const { selectedElement, selectedProperties } = useCanvasOperation();

    const movingRelationshipSegment = useSelector((state: IStoreState) => {
        if (canvasOperation.type === CanvasOperationEnum.MOVE_RELATIONSHIP_SEGMENT ||
            canvasOperation.type === CanvasOperationEnum.MOVE_RELATIONSHIP_HEAD ||
            canvasOperation.type === CanvasOperationEnum.MOVE_RELATIONSHIP_TAIL
            ) {
            return state.classDiagram.relationshipSegments.byId[canvasOperation.elementId];
        }
    });
    const movingRelationship = useSelector((state: IStoreState) => {
        if (movingRelationshipSegment) {
            const relationship = state.classDiagram.relationships.byId[movingRelationshipSegment.relationshipId];
            const relationshipSegments = relationship.segmentIds.map((segmentId) => {
                return state.classDiagram.relationshipSegments.byId[segmentId];
            });
            return {
                relationship,
                relationshipSegments
            };
        }
    });
    const newRelationship = useSelector((state: IStoreState) => state.classDiagram.newRelationship);

    
    const onMouseMove = (coordinates: ICoordinates, previousMousePosition: ICoordinates) => {
        const moveDependingRelationships = () => {
            const toElementRelationshipsIds = classDiagram.relationships.allIds.filter((id) => classDiagram.relationships.byId[id].toElementId === selectedElement.id);
            const toElementRelationships = toElementRelationshipsIds.map((id) => classDiagram.relationships.byId[id]);
            let fixX = 0;
            toElementRelationships.forEach((toRelationship) => {
                const xShift = toRelationship.head.x - previousMousePosition.x;
                const yShift = toRelationship.head.y - previousMousePosition.y;
                const segments = toRelationship.segmentIds.map((id) => classDiagram.relationshipSegments.byId[id]);
                const endingSegment = segments.filter((segment) => segment.isEnd)[0];
                // if (toRelationship.type === ClassDiagramRelationshipTypesEnum.AGGREGATION) {
                //     fixX = endingSegment.lineToX < 0 ? 30 : 0;
                // }
                toRelationship.head.x -= fixX;
                const { relationship, relationshipSegments } = updateRelationshipEndingHelper(
                    { x: coordinates.x + xShift, y: coordinates.y + yShift },
                    toRelationship,
                    endingSegment,
                    segments.filter((segment) => segment.toSegmentId === endingSegment.id)
                );
                relationshipSegments.find((segment) => segment.isEnd).lineToX += fixX;
                dispatch(updateRelationship(relationship));
                relationshipSegments.forEach((segment) => dispatch(updateRelationshipSegment(segment)));
            });
            const fromElementRelationshipsIds = classDiagram.relationships.allIds.filter((id) => classDiagram.relationships.byId[id].fromElementId === selectedElement.id);
            const fromElementRelationships = fromElementRelationshipsIds.map((id) => classDiagram.relationships.byId[id]);
            fromElementRelationships.forEach((fromRelationship) => {
                const xShift = fromRelationship.tail.x - previousMousePosition.x;
                const yShift = fromRelationship.tail.y - previousMousePosition.y;
                const segments = fromRelationship.segmentIds.map((id) => classDiagram.relationshipSegments.byId[id]);
                const startingSegment = segments.filter((segment) => segment.isStart)[0];
                const { relationship, relationshipSegments } = updateRelationshipStartingHelper(
                    { x: coordinates.x + xShift, y: coordinates.y + yShift },
                    fromRelationship,
                    startingSegment,
                    segments.filter((segment) => segment.fromSegmentId === startingSegment.id)
                );
                updateRelationship(relationship);
                relationshipSegments.forEach((segment) => updateRelationshipSegment(segment));
            });
        };
        if (selectedElement) {
            switch(canvasOperation.type) {
                case CanvasOperationEnum.RESIZE_ELEMENT_UP:
                    if (selectedElement.type === StateDiagramElementsEnum.STATE) {
                        dispatch(updateStateElement(resizeFrame(selectedElement as IStateElement, coordinates, Direction.UP) as IStateElement));
                    } else {
                        dispatch(updateElement(resizeFrame(selectedElement as IStateElement, coordinates, Direction.UP) as IBaseElement<any>));
                    }
                    break;
                case CanvasOperationEnum.RESIZE_ELEMENT_DOWN:
                    if (selectedElement.type === StateDiagramElementsEnum.STATE) {
                        dispatch(updateStateElement(resizeFrame(selectedElement as IStateElement, coordinates, Direction.DOWN) as IStateElement));
                    } else {
                        dispatch(updateElement(resizeFrame(selectedElement as IStateElement, coordinates, Direction.DOWN) as IBaseElement<any>));
                    }
                    break;
                case CanvasOperationEnum.RESIZE_ELEMENT_LEFT:
                    if (selectedElement.type === StateDiagramElementsEnum.STATE) {
                        dispatch(updateStateElement(resizeFrame(selectedElement as IStateElement, coordinates, Direction.LEFT) as IStateElement));
                    } else {
                        dispatch(updateElement(resizeFrame(selectedElement as IStateElement, coordinates, Direction.LEFT) as IBaseElement<any>));
                    }
                    break;
                case CanvasOperationEnum.RESIZE_ELEMENT_RIGHT:
                    if (selectedElement.type === StateDiagramElementsEnum.STATE) {
                        dispatch(updateStateElement(resizeFrame(selectedElement as IStateElement, coordinates, Direction.RIGHT) as IStateElement));
                    } else {
                        dispatch(updateElement(resizeFrame(selectedElement as IStateElement, coordinates, Direction.RIGHT) as IBaseElement<any>));
                    }
                    break;
                case CanvasOperationEnum.MOVE_ELEMENT:
                    switch(selectedElement.type) {
                        case ClassDiagramElementsEnum.CLASS:
                            moveDependingRelationships();
                            dispatch(updateElement(moveClass(selectedElement, coordinates, previousMousePosition, selectedProperties.length)));
                            break;
                        case ClassDiagramElementsEnum.UTILITY:
                            moveDependingRelationships();
                            dispatch(updateElement(moveUtility(selectedElement as IUtility, coordinates, previousMousePosition, selectedProperties.length)));
                            break;
                        case ClassDiagramElementsEnum.PRIMITIVE_TYPE:
                            moveDependingRelationships();
                            dispatch(updateElement(movePrimitiveType(selectedElement as IPrimitiveType, coordinates, previousMousePosition)));
                            break;
                        case ClassDiagramElementsEnum.INTERFACE:
                            moveDependingRelationships();
                            dispatch(updateElement(moveInterface(selectedElement as IInterface, coordinates, previousMousePosition, selectedProperties.length)));
                            break;
                        case ClassDiagramElementsEnum.ENUMERATION:
                            moveDependingRelationships();
                            dispatch(updateElement(moveEnumeration(selectedElement as IEnumeration, coordinates, previousMousePosition)));
                            break;
                        case ClassDiagramElementsEnum.DATA_TYPE:
                            moveDependingRelationships();
                            dispatch(updateElement(moveDataType(selectedElement as IDataType, coordinates, previousMousePosition)));
                            break;
                        case ClassDiagramElementsEnum.OBJECT:
                            moveDependingRelationships();
                            dispatch(updateElement(moveObject(selectedElement as IObject, coordinates, previousMousePosition)));
                            break;
                        case StateDiagramElementsEnum.STATE:
                            moveDependingRelationships();
                            dispatch(updateStateElement(moveStateElement(selectedElement as IStateElement, coordinates, previousMousePosition)));
                            break;
                        case StateDiagramElementsEnum.INITIAL_STATE:
                            moveDependingRelationships();
                            dispatch(updateInitialStateElement(moveInitialStateElement(selectedElement as IInitialStateElement, coordinates, previousMousePosition)));  
                            break;
                        case StateDiagramElementsEnum.FINAL_STATE:
                            moveDependingRelationships();
                            dispatch(updateFinalStateElement(moveFinalStateElement(selectedElement as IFinalStateElement, coordinates, previousMousePosition)));
                            break;
                        case StateDiagramElementsEnum.FORK:
                            dispatch(updateForkJoinElement(moveForkJoinElement(selectedElement as IForkJoinElement, coordinates, previousMousePosition)));
                            break;
                        case StateDiagramElementsEnum.JOIN:
                            dispatch(updateForkJoinElement(moveForkJoinElement(selectedElement as IForkJoinElement, coordinates, previousMousePosition)));
                            break;
                        case StateDiagramElementsEnum.CHOICE:
                            dispatch(updateChoiceElement(moveChoiceElement(selectedElement as IChoiceElement, coordinates, previousMousePosition)));
                            break;
                    }
                    break;
            }
        } else if (isMouseDown) {
            switch (canvasOperation.type) {
                case CanvasOperationEnum.DRAWING_NEW_RELATION:
                    let fixX = newRelationship.relationship.tail.x > coordinates.x ? -0.5 : 0.5;
                    if (newRelationship.relationship.type === ClassDiagramRelationshipTypesEnum.AGGREGATION) {
                        fixX += newRelationship.relationship.tail.x > coordinates.x ? -30 : 30;
                    }
                    const updatedRelationship = createNewRelationship(
                        canvasDefaultRelationshipType,
                        {
                            x1: newRelationship.relationship.tail.x,
                            y1: newRelationship.relationship.tail.y,
                            x2: coordinates.x - fixX,
                            y2: coordinates.y
                        }
                    );
                    dispatch(updateNewRelationship({
                        ...updatedRelationship,
                        relationship: {
                            ...updatedRelationship.relationship,
                            fromElementId: newRelationship.relationship.fromElementId,
                            toElementId: newRelationship.relationship.toElementId
                        }
                    }));
                    break;
                case CanvasOperationEnum.MOVE_RELATIONSHIP_HEAD:
                    coordinates.x -= movingRelationship.relationship.head.x > coordinates.x ? -0.5 : 0.5;
                    coordinates.y -= movingRelationship.relationshipSegments.find((segment) => segment.isEnd).y > coordinates.y ? -0.5 : 0.5;
                    // if (movingRelationship.relationship.type === ClassDiagramRelationshipTypesEnum.AGGREGATION) {
                    //     coordinates.x -= movingRelationship.relationship.tail.x > coordinates.x ? -30 : 30;
                    // }
                    const dependentSegments = movingRelationship.relationshipSegments.filter((segment) => {
                        return segment.id === movingRelationshipSegment.toSegmentId || segment.id === movingRelationshipSegment.fromSegmentId;
                    });
                    const { relationship, relationshipSegments } = updateRelationshipEndingHelper(
                        coordinates,
                        movingRelationship.relationship,
                        movingRelationshipSegment,
                        dependentSegments
                    );
                    relationship.fromElementId = movingRelationship.relationship.fromElementId;
                    relationship.toElementId = movingRelationship.relationship.toElementId;
                    relationshipSegments.forEach((segment) => {
                        if (classDiagram.relationshipSegments.allIds.includes(segment.id)) {	
                            dispatch(updateRelationshipSegment(segment));	
                        } else {	
                            dispatch(addNewRelationshipSegment(segment));	
                        }
                    });
                    dispatch(updateRelationship(relationship));
                    break;
                case CanvasOperationEnum.MOVE_RELATIONSHIP_TAIL:
                    coordinates.x -= movingRelationship.relationship.tail.x > coordinates.x ? -0.5 : 0.5;
                    coordinates.y -= movingRelationship.relationshipSegments.find((segment) => segment.isStart).y > coordinates.y ? -0.5 : 0.5;
                    const tailDependentSegments = movingRelationship.relationshipSegments.filter((segment) => {
                        return segment.id === movingRelationshipSegment.toSegmentId || segment.id === movingRelationshipSegment.fromSegmentId;
                    });
                    const { relationship: startingRelationships, relationshipSegments: startingRelationshipSegments } = updateRelationshipStartingHelper(
                        coordinates,
                        movingRelationship.relationship,
                        movingRelationshipSegment,
                        tailDependentSegments
                    );
                    startingRelationships.fromElementId = movingRelationship.relationship.fromElementId;
                    startingRelationships.toElementId = movingRelationship.relationship.toElementId;
                    startingRelationshipSegments.forEach((segment) => {
                        if (classDiagram.relationshipSegments.allIds.includes(segment.id)) {	
                            dispatch(updateRelationshipSegment(segment));	
                        } else {	
                            dispatch(addNewRelationshipSegment(segment));	
                        }
                    });
                    dispatch(updateRelationship(startingRelationships));
                    break;
                case CanvasOperationEnum.MOVE_RELATIONSHIP_SEGMENT:
                    if (movingRelationshipSegment) {
                        // const { relationship, relationshipSegments } = updateRelationshipHelper(
                        //     movingRelationshipSegment.direction,
                        //     movingRelationship.relationship,
                        //     movingRelationship.relationshipSegments,
                        //     movingRelationshipSegment.id,
                        //     coordinates
                        // );
                        const dependentSegments = movingRelationship.relationshipSegments.filter((segment) => {
                            return segment.id === movingRelationshipSegment.toSegmentId || segment.id === movingRelationshipSegment.fromSegmentId;
                        });
                        const { relationship, relationshipSegments } = updateRelationshipHelper(
                            coordinates,
                            movingRelationship.relationship,
                            movingRelationshipSegment,
                            dependentSegments
                        );
                        relationship.fromElementId = movingRelationship.relationship.fromElementId;
                        relationship.toElementId = movingRelationship.relationship.toElementId;
                        relationshipSegments.forEach((segment) => {
                            if (classDiagram.relationshipSegments.allIds.includes(segment.id)) {	
                                dispatch(updateRelationshipSegment(segment));	
                            } else {	
                                dispatch(addNewRelationshipSegment(segment));	
                            }
                        });
                        dispatch(updateRelationship(relationship));
                    }
                    break;
            }
        }
    };

    return { onMouseMove };
};

export default useCanvasMouseMove;