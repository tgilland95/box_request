import * as React from 'react';
import { Toggle } from 'office-ui-fabric-react';

export interface IBoxFolderToggle {
    isChecked: boolean
    openWarning(): void
}
// makeToggle(): void 

export function BoxFolderToggle(props: IBoxFolderToggle) {
    return (
        <div style={ { padding: '2px' } }>
        <Toggle
            checked={ props.isChecked }
            label='Request Boxes or Folders'
            onAriaLabel='This toggle is checked. Press to uncheck.'
            offAriaLabel='This toggle is unchecked. Press to check.'
            onText='Boxes'
            offText='Folders'
            onChanged={props.openWarning}
            // onChanged={props.makeToggle}
        />
        </div>
    )
}