import { createFrame, moveFrame } from './frame';
import ICoordinates from '@interfaces/ICoordinates';
import ClassDiagramElementsEnum from '@enums/classDiagramElementsEnum';
import { v4 } from 'uuid';
import IClass from '@interfaces/class-diagram/class/IClass';
import IClassProperty from '@interfaces/class-diagram/class/IClassProperty';
import AccessModifierEnum from '@enums/accessModifierEnum';
import IClassMethod from '@interfaces/class-diagram/class/IClassMethod';
import EntryTypeEnum from '@enums/EntryTypeEnum';

export const createNewBaseClass = (coordinates: ICoordinates, frameRows = 2) => {
    const frame = createFrame(coordinates, frameRows);

    const newBaseClass: IClass = {
        id: v4(),
        type: ClassDiagramElementsEnum.CLASS,
        data: {
            elementName: 'base class Name',
            entryIds: []
        },
        graphicData: {
            frame,
            sections: {
                head: {
                    y: frame.y
                },
                properties: {
                    y: frame.y + frame.rowHeight
                },
                methods: {
                    y: frame.y + (2 * frame.rowHeight)
                }
            }
        }
    };

    return {
        newBaseClass
    };
};

export const createNewClass = (coordinates: ICoordinates) => {
    const { newBaseClass } = createNewBaseClass(coordinates, 3);

    const classPropertyId = v4();
    const newClassProperty: IClassProperty = {
        id: classPropertyId,
        type: EntryTypeEnum.PROPERTY,
        accessModifier: AccessModifierEnum.PUBLIC,
        value: 'property_1'
    };

    const classMethodId = v4();
    const newClassMethod: IClassMethod = {
        id: classMethodId,
        type: EntryTypeEnum.METHOD,
        accessModifier: AccessModifierEnum.PUBLIC,
        value: 'method_1'
    };

    const newClass: IClass = {
        ...newBaseClass,
        data: {
            elementName: 'class name',
            entryIds: [classMethodId, classPropertyId]
        }
    };

    return {
        newClass,
        newClassProperty,
        newClassMethod
    };
};

export const moveClass = (classElement: IClass, coordinates: ICoordinates, oldCursorPosition: ICoordinates, propertyCount: number): IClass => {
    const newFrame = moveFrame(classElement, coordinates, oldCursorPosition);

    return {
        ...classElement,
        graphicData: {
            frame: newFrame,
            sections: {
                head: {
                    y: newFrame.y
                },
                properties: {
                    y: newFrame.y + newFrame.rowHeight
                },
                methods: {
                    y: newFrame.y + ((1 + propertyCount) * newFrame.rowHeight)
                }
            }
        }
    };
};

export const updateClassGraphicData = (classElement: IClass, propertyCount: number, methodCount: number) => {
    const { graphicData } = classElement;

    if (methodCount === 0 && propertyCount === 0) {
        graphicData.frame.height = 2 * graphicData.frame.rowHeight;
    } else {
        classElement.graphicData.sections.methods.y = classElement.graphicData.frame.y + (
            (propertyCount + 1) * classElement.graphicData.frame.rowHeight
        );

        classElement.graphicData.frame.height = (
            propertyCount + methodCount + 1
        ) * classElement.graphicData.frame.rowHeight;
    }

    return {
        ...classElement,
        graphicData
    };
};