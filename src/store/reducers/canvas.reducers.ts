import CanvasActionEnum from '@enums/canvasActionEnum';
import ICanvasOperation from '@interfaces/ICanvasOperation';
import CanvasOperationEnum from '@enums/canvasOperationEnum';
import IReducerPayload from '@interfaces/IReducerPayload';
import ClassDiagramElementsEnum from '@enums/classDiagramElementsEnum';
import ClassDiagramRelationshipTypesEnum from '@enums/classDiagramRelationshipTypesEnum';
import DiagramTypeEnum from '@enums/diagramTypeEnum';
import ICoordinates from '@interfaces/ICoordinates';

const diagramType = DiagramTypeEnum.NONE;
const defaultRelationshipType = ClassDiagramRelationshipTypesEnum.ASSOCIATION; 
const isMouseDownState = false;
const selectedElementId = '';
const canvasOperationState: ICanvasOperation = {
    type: CanvasOperationEnum.NONE,
    elementId: ''     
};
const canvasDimensionsState: ICoordinates = {
    x: 4400,
    y: 4684
};

export const canvasDimensionsReducer = (state = canvasDimensionsState) => {
    return state;
};

export const diagramTypeReducer = (state = diagramType, payload: IReducerPayload<CanvasActionEnum, DiagramTypeEnum>) => {
    switch (payload.type) {
        case CanvasActionEnum.SET_DIAGRAM_TYPE:
            return payload.data;
        default:
            return state;
    }
};

export const defaultRelationshipTypeReducer = (state = defaultRelationshipType, payload: IReducerPayload<CanvasActionEnum, ClassDiagramRelationshipTypesEnum>) => {
    switch (payload.type) {
        case CanvasActionEnum.SET_DEFAULT_RELATIONSHIP_TYPE:
            return payload.data;
        default:
            return state;
    }
};

export const canvasOperationReducer = (state = canvasOperationState, payload: IReducerPayload<CanvasActionEnum, ICanvasOperation>) => {
    switch(payload.type) {
        case CanvasActionEnum.NEW_CANVAS_OPERATION:
            return {...payload.data};
        default:
            return state;
    }
};

export const isMouseDownReducer = (state = isMouseDownState, payload: IReducerPayload<CanvasActionEnum, Boolean>) => {
    switch(payload.type) {
        case CanvasActionEnum.IS_MOUSE_DOWN:
            return payload.data;
        default:
            return state;
    }
};

export const selectedElementIdReducer = (state = selectedElementId, payload: IReducerPayload<CanvasActionEnum, string>) => {
    switch(payload.type){
        case CanvasActionEnum.SELECT_NEW_ELEMENT:
            return payload.data;
        default:
            return state;
    }
};
