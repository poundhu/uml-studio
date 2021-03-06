import { parseStringPromise } from 'xml2js';
import ICoordinates from '@interfaces/ICoordinates';
import ISCXML from '@interfaces/scxml/ISCXML';
import ISCXMLState from '@interfaces/scxml/ISCXMLState';
import { createNewStateElementFromSCXML, createNewFinalStateElement } from './elements/stateElement';
import ISCXMLTransition from '@interfaces/scxml/ISCXMLTransition';
import IStateElement from '@interfaces/state-diagram/state/IStateElement';
import ISCXMLParallel from '@interfaces/scxml/ISCXMLParallel';
import ICSXMLFinal from '@interfaces/scxml/ICSXMLFinal';
import IFinalStateElement from '@interfaces/state-diagram/final-state/IFinalStateElement';
import StateDiagramElementsEnum from '@enums/stateDiagramElementsEnum';
import { createNewRelationship, createNewRelationshipSameLayerSCXML } from './elements/relationship';
import ClassDiagramRelationshipTypesEnum from '@enums/classDiagramRelationshipTypesEnum';
import IRelationship from '@interfaces/class-diagram/relationships/IRelationship';
import IRelationshipSegment from '@interfaces/class-diagram/relationships/IRelationshipSegment';
import Direction from '@enums/direction';

export const parseStateDiagram = async (xml: string, canvasDimensions: ICoordinates) => {
    const newStateElements: Array<IStateElement> = [];
    const newFinalStateElements: Array<IFinalStateElement> = [];
    const newRelationShips: Array<IRelationship> = [];
    const newRelationShipSegments: Array<IRelationshipSegment> = [];
    const scxmlExistingStates: Array<string> = [];

    const scxml: ISCXML = (await parseStringPromise(xml)).scxml;

    const canvasMiddle: ICoordinates = { x: canvasDimensions.x / 2, y: canvasDimensions.y / 2 };
    const coordinates: ICoordinates = { x: canvasMiddle.x, y: canvasMiddle.y };

    const layerDistance = 300;
    const elementDistance = 120;

    if (scxml) {
        const scxmlStates = scxml.state ?? [];
        const scxmlParallels = scxml.parallel ?? [];
        const scxmlFinals = scxml.final ?? [];
        if (scxmlStates || scxmlParallels) {
            const { scxmlInitialState, newInitialStateElement } = createInitialDiagramState(scxml, coordinates);
            if(newInitialStateElement.type === StateDiagramElementsEnum.STATE) {
                newStateElements.push(newInitialStateElement as IStateElement);
                scxmlExistingStates.push(scxmlInitialState.$.id);
            } else if (newInitialStateElement.type === StateDiagramElementsEnum.FINAL_STATE) {
                newFinalStateElements.push(newInitialStateElement as IFinalStateElement);
                scxmlExistingStates.push(scxmlInitialState.$.id);
            }

            if (scxmlStates) {
                let elementsToAdd = [
                    ...scxmlStates.filter((scxmlState) => scxmlExistingStates.indexOf(scxmlState.$.id) === -1),
                    ...scxmlParallels.filter((scxmlParallel) => scxmlExistingStates.indexOf(scxmlParallel.$.id) === -1),
                    ...scxmlFinals.filter((scxmlFinal) => scxmlExistingStates.indexOf(scxmlFinal.$.id) === -1)
                ];
                let previousLayer: Array<ISCXMLState> = [scxmlInitialState];
                let currentLayer: Array<ISCXMLState> = [];
                while (elementsToAdd.length > 0) {
                    currentLayer = [];
                    coordinates.x += layerDistance;
                    let toAdd: Array<ISCXMLTransition> = [];
                    let transitionToAdd: Array<{
                        transition: ISCXMLTransition,
                        from: string;
                    }> = [];
                    previousLayer.forEach((scxmlState) => {
                        if (scxmlState.transition && scxmlState.transition.length > 0) {
                            const statesToAdd = scxmlState.transition.filter((transition) => elementsToAdd.findIndex((t) => t.$.id === transition.$.target) !== -1);
                            toAdd.push(...statesToAdd);
                            transitionToAdd.push(
                                ...scxmlState.transition.map((s) => {
                                    return {
                                        transition: s,
                                        from: scxmlState.$.id
                                    };
                                })
                            );
                            scxmlExistingStates.push(...statesToAdd.map((t) => t.$.target));
                            elementsToAdd = [
                                ...scxmlStates.filter((scxmlState) => scxmlExistingStates.indexOf(scxmlState.$.id) === -1),
                                ...scxmlParallels.filter((scxmlParallel) => scxmlExistingStates.indexOf(scxmlParallel.$.id) === -1),
                                ...scxmlFinals.filter((scxmlFinal) => scxmlExistingStates.indexOf(scxmlFinal.$.id) === -1)
                            ];
                        }
                    });
    
                    if (toAdd.length % 2 === 0) {
                        coordinates.y -= elementDistance * (toAdd.length / 2);
                    } else if (toAdd.length > 1) {
                        coordinates.y -= elementDistance * ((toAdd.length - 1) / 2);
                    }
                    
                    toAdd.forEach((transition) => {
                        const { newState, scxmlState, newFinal } = createTargetedState(scxmlStates, scxmlParallels, scxmlFinals, transition, coordinates);
                        if (newState) {
                            newStateElements.push(newState);
                            coordinates.y += elementDistance + newState.graphicData.frame.height;
                        }
                        if (newFinal) {
                            newFinalStateElements.push(newFinal);
                            coordinates.y += elementDistance;
                        }
                        currentLayer.push(scxmlState);
                    });

                    coordinates.y = canvasMiddle.y;
                    previousLayer = currentLayer;
                }

                const existingStates = scxmlStates.map((scxmlState) => {
                    return {
                        name: scxmlState.$.id,
                        upOffset: 0,
                        downOffset: 0
                    };
                });
                scxmlStates.forEach((scxmlState) => {
                    let relationshipCenterOffsetUp = 0;
                    let relationshipCenterOffsetDown = 0;
                    const fromState = newStateElements.find((stateElement) => stateElement.data.name === scxmlState.$.id);
                    const { graphicData } = fromState;
                    const scxmlTransitions = scxmlState.transition;
                    const jointsOffsetY = (fromState.graphicData.frame.height - (fromState.graphicData.rx * 2)) / 3;
                    const out_1: ICoordinates = {
                        x: graphicData.frame.x + graphicData.frame.width,
                        y: graphicData.frame.y + graphicData.rx
                    };
                    const out_2: ICoordinates = {
                        x: graphicData.frame.x + graphicData.frame.width,
                        y: graphicData.frame.y + graphicData.frame.height - graphicData.rx
                    };
                    if (scxmlTransitions && scxmlTransitions.length > 0) {
                        scxmlTransitions.forEach((scxmlTransition) => {
                            const toStateElement = newStateElements.find((stateElement) => stateElement.data.name === scxmlTransition.$.target);
                            const toFinalStateElement = newFinalStateElements.find((finalStateElement) => finalStateElement.name === scxmlTransition.$.target);
                            let offsetJoin = 0;
                            const toStateElementPosition: Direction = fromState.graphicData.frame.x > toStateElement.graphicData.frame.x ? Direction.LEFT : Direction.RIGHT;
                            const toStateElementPositionY: Direction = fromState.graphicData.frame.y >= toStateElement.graphicData.frame.y ? Direction.UP : Direction.DOWN;
                            let offsetRelation = 0;
                            if (toStateElementPositionY === Direction.UP) {
                                if (toStateElementPosition === Direction.RIGHT) {
                                    if (relationshipCenterOffsetUp > -80) {
                                        relationshipCenterOffsetUp -= 15;
                                    }
                                    offsetRelation = relationshipCenterOffsetUp;
                                } else {
                                    let t = existingStates.find((s) => s.name === scxmlTransition.$.target);
                                    if (t.upOffset < 80) {
                                        t.upOffset += 15;
                                    }
                                    offsetRelation = t.upOffset;
                                }
                            } else {
                                if (toStateElementPosition === Direction.RIGHT) {
                                    if (relationshipCenterOffsetDown > -80) {
                                        relationshipCenterOffsetDown -= 15;
                                    }
                                    offsetRelation = relationshipCenterOffsetDown;
                                } else {
                                    let t = existingStates.find((s) => s.name === scxmlTransition.$.target);
                                    if (t.downOffset < 80) {
                                        t.downOffset += 15;
                                    }
                                    offsetRelation = t.downOffset;
                                }
                            }
                            const snapPoint: ICoordinates = {
                                x: toStateElement ? toStateElement.graphicData.frame.x : toFinalStateElement.graphicData.x,
                                y: 0
                            };

                            if (toStateElement) {
                                offsetJoin = (toStateElement.graphicData.frame.height - (toStateElement.graphicData.rx * 2)) / 3;
                                snapPoint.y = toStateElement.graphicData.frame.y + toStateElement.graphicData.rx;
                            } else if (toFinalStateElement) {
                                snapPoint.y = toFinalStateElement.graphicData.y;
                            }
                            if (toStateElement.graphicData.frame.x === fromState.graphicData.frame.x) {
                                const { relationship, relationshipSegments } = createNewRelationship(
                                    ClassDiagramRelationshipTypesEnum.ASSOCIATION,
                                    {
                                        x1: toStateElementPosition === Direction.LEFT ? graphicData.frame.x : out_1.x,
                                        y1: toStateElementPosition === Direction.LEFT ? out_1.y + offsetJoin : 
                                            toStateElementPositionY === Direction.UP ? out_1.y : out_2.y,
                                        x2: toStateElement.graphicData.frame.x + toStateElement.graphicData.frame.width,
                                        y2: toStateElementPositionY === Direction.UP ? snapPoint.y + (offsetJoin * 3) : snapPoint.y
                                    },
                                    fromState.id,
                                    toStateElement ? toStateElement.id : toFinalStateElement.id,
                                    20
                                );
                                newRelationShips.push(relationship);
                                newRelationShipSegments.push(...relationshipSegments);
                            } else {
                                const { relationship, relationshipSegments } = createNewRelationship(
                                    ClassDiagramRelationshipTypesEnum.ASSOCIATION,
                                    {
                                        x1: toStateElementPosition === Direction.LEFT ? graphicData.frame.x : out_1.x,
                                        y1: toStateElementPosition === Direction.LEFT ? out_1.y + offsetJoin : 
                                            toStateElementPositionY === Direction.UP ? out_1.y : out_2.y,
                                        x2: toStateElementPosition === Direction.LEFT ? toStateElement.graphicData.frame.x + toStateElement.graphicData.frame.width : snapPoint.x,
                                        y2: toStateElementPosition === Direction.LEFT ?
                                            toStateElementPositionY === Direction.UP ? snapPoint.y + (offsetJoin * 2) : snapPoint.y + offsetJoin : snapPoint.y
                                    },
                                    fromState.id,
                                    toStateElement ? toStateElement.id : toFinalStateElement.id,
                                    offsetRelation,
                                    scxmlTransition.$.event
                                );
                                newRelationShips.push(relationship);
                                newRelationShipSegments.push(...relationshipSegments);
                            }
                        });
                    }
                });

            }
        }
    }

    return { 
        newStateElements,
        newFinalStateElements,
        newRelationShips,
        newRelationShipSegments
    };
};

const createInitialDiagramState = (scxml: ISCXML, coordinates: ICoordinates) => {
    let scxmlInitialState: ISCXMLState;
    let newInitialStateElement;
    if (scxml.state) {
        if (scxml.$.initial) {
            scxmlInitialState = scxml.state.find((state) => state.$.id === scxml.$.initial);
        } else {
            scxmlInitialState = scxml.state[0];
        }
        newInitialStateElement = createNewStateElementFromSCXML(scxmlInitialState, coordinates);
    } else {
        let finalState;
        if (scxml.$.initial) {
            finalState = scxml.final.find((state) => state.$.id === scxml.$.initial);
        } else {
            finalState = scxml.final[0];
        }
        newInitialStateElement = createNewFinalStateElement(coordinates, finalState.$.id).finalStateElement;
        scxmlInitialState = {
            $: {
                id: finalState.$.id
            },
            transition: [],
            invoke: [],
            onentry: [],
            onexit: []
        };
    }
    
    return {
        newInitialStateElement,
        scxmlInitialState
    };
};

const createTargetedState = (scxmlStates: Array<ISCXMLState>, scxmlParallels: Array<ISCXMLParallel>, scxmlFinal: Array<ICSXMLFinal>, scxmlTransitions: ISCXMLTransition, coordinates: ICoordinates) => {
    let targetedState = scxmlStates.find((state) => state.$.id === scxmlTransitions.$.target);
    let newState;
    let newFinal;
    if (targetedState) {
        newState = createNewStateElementFromSCXML(targetedState, coordinates);
    } else {
        let final = scxmlFinal.find((final) => final.$.id === scxmlTransitions.$.target);
        const { finalStateElement } = createNewFinalStateElement(coordinates, final.$.id);
        newFinal = finalStateElement;
        targetedState = {
            $: {
                id: final.$.id
            },
            transition: [],
            invoke: [],
            onentry: [],
            onexit: []
        };
    }
    return {
        newState,
        scxmlState: targetedState,
        newFinal,
    };
};