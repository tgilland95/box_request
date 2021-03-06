import * as React from 'react'
import { PrimaryButton, ThemeSettingName } from 'office-ui-fabric-react/'
import { initializeIcons } from '@uifabric/icons'
import { IFolderAndBox, ModalTypes, IBoxData, IRequestObject } from '../models/'
import {
  AppStyles,
  DepartmentDropdown,
  WarningModal,
  SubmitModal,
  CreateFolderModal,
  BoxList,
  FolderView,
  RequestCart,
  Greeting
} from '.'
import { ISubmitModal } from './SubmitModal'

interface IAppState {
  selectedItems: Map<number, IFolderAndBox>
  selectedDep: number
  selectedBox: IBoxData | undefined
  isChecked: boolean
  newFolderNameInput: string
  newFolderDescriptionInput: string
  modal: ModalTypes
  request: Map<number, IRequestObject>
  deliveryInstructions: string
  requestTypeToggle: boolean
  deliveryPriorityToggle: boolean
}

// Enables microsoft ui icons to appear
initializeIcons()

export class App extends React.Component<
  { user; boxData; folderData },
  IAppState
> {
  boxData = this.props.boxData
  folderData = this.props.folderData
  state = {
    selectedItems: new Map(),
    selectedDep: 0,
    selectedBox: undefined,
    isChecked: true,
    newFolderNameInput: '',
    newFolderDescriptionInput: '',
    modal: undefined,
    request: new Map(),
    requestTypeToggle: false,
    deliveryPriorityToggle: false,
    deliveryInstructions: ''
  }

  // function used to change the selected department via the dropdown menu
  changeSelectedDep = (val: number) => {
    this.setState({
      selectedDep: val
    })
  }

  addItemToCheckout = (e: IFolderAndBox) =>
    this.setState({
      selectedItems: this.state.selectedItems.set(
        e.BoxIdBarCode | e.FolderIdBarCode,
        e
      )
    })

  removeItemFromCheckout = (r: number) => {
    const newMap = this.state.selectedItems
    newMap.delete(r)
    this.setState({
      selectedItems: newMap
    })
  }

  removeAllItemsFromCheckout = () => {
    this.setState({
      selectedItems: new Map()
    })
  }

  toggleModal = (modalName: ModalTypes) => this.setState({ modal: modalName })

  // filter boxData to get the boxes within in the currently selected department
  getFilteredData = () =>
    this.boxData.filter((x, i) => x.DepId === this.state.selectedDep)

  getFilteredFolders = () =>
    this.folderData.filter(
      (x, i) => x.BoxID === this.state.selectedBox.BoxIdBarCode
    )

  getParentBoxInfo = (boxId: number) => {
    return this.boxData.filter((x) => x.BoxIdBarCode === boxId)[0]
  }

  // These two functions work with the text fields in CreateFolderModal.  They let the user type in a folder name and description.
  updateFolderName = (value) => {
    this.setState({
      newFolderNameInput: value
    })
  }

  updateFolderDescription = (value) => {
    this.setState({
      newFolderDescriptionInput: value
    })
  }

  createNewFolder = (e) => {
    if (
      this.state.newFolderNameInput.length > 0 &&
      this.state.newFolderDescriptionInput.length > 0
    ) {
      this.folderData.push({
        // parent box depends on which box they selected
        BoxID: this.state.selectedBox.BoxIdBarCode,
        // comes from the values entered by user from text fields
        FolderName: this.state.newFolderNameInput,
        Folder_Description: this.state.newFolderDescriptionInput
      })
      // closes the modal and resets the data so user cannot easily make the same folder twice
      this.setState({
        modal: ModalTypes.none,
        newFolderNameInput: '',
        newFolderDescriptionInput: ''
      })
    }
  }

  updateDeliveryInstructions = (value) => {
    this.setState({
      deliveryInstructions: value
    })
  }

  updateRequestType = () => {
    console.log(!!this.state.requestTypeToggle)
    this.setState({
      requestTypeToggle: !this.state.requestTypeToggle
    })
  }

  updateDeliveryPriority = () => {
    console.log(!!this.state.deliveryPriorityToggle)
    this.setState({
      deliveryPriorityToggle: !this.state.deliveryPriorityToggle
    })
  }

  // This function creates the final request objects with the data necessary to communicate with the rock.
  addValues = (key: number, setVals: Map<number, IFolderAndBox>) => {
    let additionalVals = setVals.get(key)
    if (additionalVals.BoxIdBarCode === undefined) {
      additionalVals['type'] = 'Folder'
      additionalVals['folderNumber'] = additionalVals.FolderIdBarCode
      additionalVals['parentBox'] = additionalVals.BoxID
      additionalVals['requestingDepartment'] = this.getParentBoxInfo(
        additionalVals.BoxID
      ).DepId
      additionalVals['location'] = this.getParentBoxInfo(
        additionalVals.BoxID
      ).Location
    } else {
      additionalVals['type'] = 'Box'
      additionalVals['boxNumber'] = additionalVals.BoxIdBarCode
      additionalVals['requestingDepartment'] = additionalVals.DepId
      additionalVals['location'] = additionalVals.Location
    }
    delete additionalVals.key
    additionalVals['requestType'] = this.state.requestTypeToggle
      ? 'Permament'
      : 'Temporary'
    additionalVals['deliveryPriority'] = this.state.deliveryPriorityToggle
      ? 'Urgent'
      : 'Standard'
    additionalVals['requestStatus'] = 'New'
    additionalVals['deliveryInstructions'] = this.state.deliveryInstructions

    return additionalVals
  }

  submitRequest = (items: Map<number, IFolderAndBox>) => {
    let newRequest = new Map() // make a new map
    let iterator1 = items.keys() // create a list of all the different keys in selectedItems map
    for (let i = 0; i < items.size; i++) {
      // loop through as many times as there are items in selectedItems map
      let mrKey = iterator1.next().value // start with the first key and move on to the next key when loop iterates next
      newRequest.set(i, this.addValues(mrKey, items)) // set the values of new map to the modified values from addVal function
    }
    this.setState({
      request: newRequest
    })
    this.state.selectedItems.clear()
    this.toggleModal(ModalTypes.none)
    console.log(this.state.request)
  }

  finalRequest = (newRequest) => {
    this.setState({
      request: newRequest
    })
  }

  render() {
    window['appState'] = this.state
    return (
      <div>
        <Greeting
          name={this.props.user.name}
          departmentid={this.props.user.departments}
        />

        <div style={AppStyles.department}>
          <DepartmentDropdown
            mockUser={this.props.user}
            mockData={this.boxData}
            changeSelectedDep={this.changeSelectedDep}
          />

          {this.state.modal === ModalTypes.submit && (
            <SubmitModal
              close={() => this.toggleModal(ModalTypes.none)}
              updateInstructions={(e) => this.updateDeliveryInstructions(e)}
              priority={this.updateDeliveryPriority}
              requestType={this.updateRequestType}
              submit={(e) => this.submitRequest(e)}
              selectedItems={this.state.selectedItems}
              deliveryInstructions={this.state.deliveryInstructions}
            />
          )}
          {this.state.modal === ModalTypes.create && (
            <CreateFolderModal
              closeModal={() => this.toggleModal(ModalTypes.none)}
              selectedBox={this.state.selectedBox.BoxIdBarCode}
              createNewFolder={(x) => this.createNewFolder(x)}
              updateName={(e) => this.updateFolderName(e)}
              newNameInput={this.state.newFolderNameInput}
              updateDescription={(e) => this.updateFolderDescription(e)}
              newDescriptionInput={this.state.newFolderDescriptionInput}
            />
          )}
        </div>

        {/* Conditional Rendering.  BoxList and RequestCart won't render until selectedDep != 0 */}

        {!!this.state.selectedDep && (
          <div style={AppStyles.wrapper}>
            <div style={AppStyles.leftSection}>
              <BoxList
                boxData={this.getFilteredData()}
                addBox={(e) => this.addItemToCheckout(e)}
                openModal={(i: IBoxData) => {
                  this.setState({
                    selectedBox: i
                  })
                }}
              />
            </div>
            <div style={AppStyles.centerSection}>
              {this.state.selectedBox === undefined && (
                <div style={AppStyles.selectBoxStyle} className="ms-font-xl">
                <p>Click on a box to view its folders</p>
                </div>
              )}
              {this.state.selectedBox !== undefined && (
                <FolderView
                  openModal={(i) => this.toggleModal(ModalTypes.create)}
                  closeModal={() => this.toggleModal(ModalTypes.none)}
                  filteredData={this.getFilteredFolders()}
                  selectedBox={this.state.selectedBox}
                  addFolder={(e) => this.addItemToCheckout(e)}
                  createNewFolder={(x) => this.createNewFolder(x)}
                  updateFolderName={(e) => this.updateFolderName(e)}
                  updateFolderDescription={(e) =>
                    this.updateFolderDescription(e)
                  }
                  newDescriptionInput={this.state.newFolderDescriptionInput}
                  newNameInput={this.state.newFolderNameInput}
                  toggleCreateModal={() => this.toggleModal(ModalTypes.create)}
                />
              )}
            </div>
            { this.state.selectedItems.size > 0 && (
              <div style={AppStyles.rightSection}>
                <RequestCart
                  selectedItems={this.state.selectedItems}
                  type={this.state.isChecked ? 'Box' : 'Folder'}
                  removeItemFromCheckout={(r) => this.removeItemFromCheckout(r)}
                  toggleModal={this.toggleModal}
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}
