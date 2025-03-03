import {LightningElement,wire,track} from 'lwc';
import getObjects from '@salesforce/apex/UpdateRecordHandler.getObjects';
import getFields from '@salesforce/apex/UpdateRecordHandler.getFields';
import getRecords from '@salesforce/apex/UpdateRecordHandler.getRecords';
import insertLoggerRecords from '@salesforce/apex/UpdateRecordHandler.insertLoggerRecords';
import {NavigationMixin} from 'lightning/navigation';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import Id from '@salesforce/user/Id';
import TickerSymbol from '@salesforce/schema/Account.TickerSymbol';

let i = 0;
export default class RecordUpdationApithon extends NavigationMixin(LightningElement) {
    conditionEmpty=0;
    noRun=0;
    removedFields;
    value = '';
    error;
    showError;
    data;
    query;
    @track recordsList;
    rowOffset = 0;
    fieldValue;
    showBtn;
    names;
    fields = [];
    @track listObjects = [];
    @track listFields = [];
    @track listColumn = [];
    showmodel = false;
    record;
    recordEditFormValue;
    oldValueObject;
    loggerList = [];
    userId = Id;
    showDatable ='';

    //Adding Filters
    index = 0;
    @track checkFilter = [];
    enteredText = '';
    selectedValue = 'All';
    opt = '';
    options = '';
    selectedCondition;
    showCondition = '';
    yesno='';
    showCustomLogic ='';
    customTxt;
    chk = {
        FieldName:this.selectedValue,
        Operator : this.opt,
        Checkbox:this.yesno,
        SearchText:this.enteredText,
        Options: this.options,
        key : ''
    }

    @track queryResults = [];

    fieldString =''
    whereString = ''

    // get options() {
    //     return [
    //         { label: 'Equals', value: '=' },
    //         { label: 'Contains', value: 'contains' },
    //         { label: 'Starts with', value: 'startsWith' },
    //         { label: 'Ends with', value: 'endsWith' },
    //         { label: 'Greater Than(>)', value: '>' },
    //         { label: 'Less Than(<)', value: '<' },
    //         { label: 'Greater Equals(>=)', value: '>=' },
    //         { label: 'Less Equals(<=)', value: '<=' }
    //     ];
    // }

    get conditions() {
        return [
            { label: 'All Conditions Are Met(AND)', value: 'AND' },
            { label: 'Any Condition Is Met(OR)', value: 'OR' },
            { label: 'Custom Condition Logic Is Met', value:'customLogic'}
        ];
    }

    get checkboxes(){
        return [
            { label: 'YES', value: 'YES' },
            { label: 'NO', value: 'NO' },
        ];
    }


    // Done


    // Return selected field names as columns inside the datatable.
    get columns() {
        return this.listColumn;
    }

    // Return list of objects from custom metadata.
    @wire(getObjects) wiredGetObjects({
        error,
        data
    }) {
        if (data) {
            for (i = 0; i < data.length; i++) {
                this.listObjects = [...this.listObjects, {
                    value: data[i].Object_API_Name__c,
                    label: data[i].Label
                }];
            }
        } else if (error) {
            this.error = error;
        }
    }

    // Return list of fields for the selected object from custom metadata.
    @wire(getFields, {
        selectedObject: '$value'
    }) wiredGetFields({
        error,
        data
    }) {
        if (data) {
            for (i = 0; i < data.length; i++) {
                this.listFields = [...this.listFields, {
                    value: data[i].Field_API_Name__c,
                    label: data[i].Label
                }];
                console.log(this.listFields);
            }
            console.log(this.listFields);
        } else if (error) {
            this.error = error;
        }
    }

    // Return list of objects to the objects picklist.
    get getObjectOptions() {
        console.log(this.listObjects);
        return this.listObjects;
    }

    // Return list of fields of the selected object to the fields picklist.
    get getFieldOptions() {
        console.log(this.listFields);
        return this.listFields;
    }


    get selected() {
        return this.fieldValue.length ? this.fieldValue : 'none';
    }

    // Fetch the changed object from the object picklist.
    handleObjectChange(event) {
        this.value = event.detail.value;
        //
        if(this.fieldValue){
                for (i = 0; i < this.fieldValue.length; i++) {
                    this.fieldValue[i]+='changed';
                    console.log('inside object change loop'+JSON.stringify(this.fieldValue[i]));
                }
        }
        this.refreshComp();
        //
    }

    // Fetch the selected fields from the field picklist.
    handleFieldChange(event) {
        this.fieldValue = event.detail.value;
        this.fields = []
        for (i = 0; i < this.fieldValue.length; i++) {
            this.fields = [...this.fields, {
                fieldName: this.fieldValue[i]
            }];
        }

        console.log(this.fieldValue + 'fieldvalue fieldvalue fieldvalue' + this.fields);
        this.listColumn = [];
    }
    //
    refreshComp(){
        //this.value = '';
        this.fieldValue='';
        this.listFields = [];
        this.whereString = '';
        this.checkFilter =[];
        this.listColumn = [];
        this.recordsList=[];
        this.showCondition='';
        this.showCustomLogic='';
        this.selectedCondition='';
        this.showDatable='';
        this.filterButton='';
        this.index=0;
    }//

    // Query and show records with columns in the datatable.
    handleShowData() {
        let query = "SELECT " + this.fieldValue + " FROM " + this.value;
        if(this.whereString!==''){
            console.log('Inside Query If'+this.whereString);
            query += " WHERE "+ this.whereString;
        }
        console.log('query ' + query);
        getRecords({
                query: query
            })
            .then((result) => {
                this.recordsList = result[1];
                this.removedFields = result[0][0];
                console.log(JSON.stringify(this.removedFields)+' = '+JSON.stringify(this.fieldValue))
                if(this.noRun !== 1){
                if(this.removedFields && (JSON.stringify(this.removedFields.sort()) !== JSON.stringify(this.fieldValue.sort()))){
                    this.showError = 'You do not have sufficient priviledge for these fields : '+this.removedFields+'. You can still view other fields records.';
                    console.log(JSON.stringify(this.removedFields)+'if = '+JSON.stringify(this.fieldValue))
                    this.showWarningToast();
                }
                else if(this.removedFields && (JSON.stringify(this.removedFields.sort()) === JSON.stringify(this.fieldValue.sort()))){
                    this.showDatable=''
                    this.showError = 'You do not have sufficient priviledge for the selected fields : '+this.removedFields;
                    console.log(JSON.stringify(this.removedFields)+' else = '+JSON.stringify(this.fieldValue))
                    this.showErrorToast();
                }
            }
            else{
                this.noRun = 0;
            }
                this.recordsListSearch = result[1];
                this.error = undefined;
                console.log('result--' + JSON.stringify(this.removedFields));
                console.log('recordsList--' + JSON.stringify(this.recordsList));
            })
            .catch((error) => {
                this.error = error;
                this.showError = this.error.body.message;
                if(this.conditionEmpty!==1){
                    this.showErrorToast();
                }
                else{
                    this.conditionEmpty=0;
                }
                console.log('handle show query'+JSON.stringify(this.error));
                // console.log('handle show query open'+JSON.stringify(showError));
            });
        this.listColumn = [];
        for (i = 0; i < this.fieldValue.length; i++) {
            this.listColumn = [...this.listColumn, {
                label: this.fieldValue[i],
                fieldName: this.fieldValue[i],
                hideDefaultActions: true
            }];
        }
        this.listColumn = [...this.listColumn, {
                label: "View Record",
                type: "button",
                typeAttributes: {
                    label: 'View',
                    name: 'View',
                    title: 'View',
                    disabled: false,
                    value: 'view',
                    iconPosition: 'left'
                }
            },
            {
                label: "Edit Record",
                type: "button",
                typeAttributes: {
                    label: 'Edit',
                    name: 'Edit',
                    title: 'Edit',
                    disabled: false,
                    value: 'edit',
                    iconPosition: 'left'
                }
            }
        ];
        console.log('listColumn--' + JSON.stringify(this.listColumn));
        this.showDatable='show';
    }

    
    // Function to View or Edit the selected record.
    callRowAction(event) {
        const recId = event.detail.row.Id;
        const actionName = event.detail.action.name;
        if (actionName === 'Edit') {
            this.record = recId;
            this.names = this.fields;
            this.showmodel = true;

            for (let index = 0; index < this.recordsList.length; index++) {
                if (this.record === this.recordsList[index]['Id']) {
                    this.oldValueObject = this.recordsList[index];
                    delete this.oldValueObject['Id'];
                    console.log('this.recordsList[index]--' + JSON.stringify(this.oldValueObject));
                }
            }
        } else if (actionName === 'View') {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: recId,
                    objectApiName: this.value,
                    actionName: 'view'
                }
            })
        }
    }

    // Close the modal.
    closem() {
        this.noRun=1
        this.showmodel = false;
        this.handleShowData();
    }

    // Show the success message
    showToast() {
        const event = new ShowToastEvent({
            variant: 'success',
            message: 'Record Updated Successfully.',
        });
        this.dispatchEvent(event);
    }

    showErrorToast() {
        const event = new ShowToastEvent({
            variant: 'error',
            message: this.showError,
        });
        this.dispatchEvent(event);
    }
    showWarningToast() {
        const event = new ShowToastEvent({
            variant: 'warning',
            message: this.showError,
        });
        this.dispatchEvent(event);
    }

    // Save the edited record on the modal and close the modal.
    handleSubmit(event) {
        this.onSubmitFields = event.detail.fields;
        this.showmodel = false;
        console.log('Succ onSubmitFields--->' + JSON.stringify(this.onSubmitFields));
    }

    // Refresh the record on the datatable based on the edit.
    refresh() {
        this.noRun = 1;
        this.handleShowData();
    }

    // Insert the logger list of new and old record values into DataFixLogger object.
    insertLoggerData() {
        insertLoggerRecords({
                loggerList: this.loggerList
            })
            .then((result) => {
                recordsList = result;
                error = undefined;
                console.log('insertLoggerData--' + JSON.stringify(recordsList));
            })
            .catch((error) => {
                error = error;
            });
    }

    // Ftech the old and new values of the record.
    handleSuccess() {
        var result = {};
        const map = new Map(Object.entries(this.onSubmitFields));
        this.loggerList = [];
        console.log('Succ test 1--->' + JSON.stringify(this.onSubmitFields));
        for (var key in this.onSubmitFields) {

            console.log('old value before if' + this.oldValueObject[key]);
            console.log('new value before if' + this.onSubmitFields[key]);

            if (this.oldValueObject[key] != this.onSubmitFields[key]) {
                console.log('inside if');
                result['oldValue'] = this.oldValueObject[key];
                result['newValue'] = this.onSubmitFields[key];
                result['fieldName'] = key;
                result['Object Name'] = this.value;
                result['Updated by'] = this.userId;
                result['id'] = this.record;
                console.log(' inside if result' + JSON.stringify(result));
                this.loggerList.push(result);
                result = {};
                console.log('iside loop this.loggerList-->' + JSON.stringify(this.loggerList));
            }

        }

        console.log('result' + JSON.stringify(result));
        console.log('this.loggerList-->' + JSON.stringify(this.loggerList));
        this.refresh();
        this.showToast();
        this.insertLoggerData();
    }

    handleReset(event) {
        const value = event.detail;
        const inputFields = this.template.querySelectorAll(
            'lightning-input-field'
        );
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
        console.log('input value-->' + value);
        console.log('input reset-->' + inputFields);
        console.log('field reset-->' + field.reset());
    }

    handleError(event) {
        console.log('Error Event');
        alert(event.detail.detail);
        this.showToast();
        this.showToast("Error", event.detail.detail, "error");
    }

    // Golbal Search
    handleSearch(event) {
        const searchKey = event.target.value.toLowerCase();
 
        if (searchKey) {
            this.recordsList = this.recordsListSearch;
            console.log('Search key record list'+this.recordsList);
 
            if (this.recordsList) {
                let searchRecords = [];
                
                console.log(this.recordsList);
                for (let record of this.recordsList) {
                    console.log('record key' + record.Id);
                    // for (const [key,value] of record){
                    //     newmap.set(key, value)
                    //  }
                    // newmap.delete('Id')
                    let valuesArray = Object.values(record);
                    console.log('valuesArray' + valuesArray);
                    
                    for (let index = 0; index < valuesArray.length-1; index++) {
                        console.log('val is ' + valuesArray[index]);
                        let strVal = String(valuesArray[index]);
 
                        if (strVal) {
 
                            if (strVal.toLowerCase().includes(searchKey)) {
                                searchRecords.push(record);
                                break;
                            }
                        }
                    }
                }
                this.recordsList = searchRecords;
            }
        } else {
            this.recordsList = this.recordsListSearch;
        }
    }

    // Logic for Filter template using dynamic where clause

    // For adding new row for filter
    addRow(){
        console.log('Add Row');
        this.index++;
        var i =this.index;
        if(i>1){
            this.showCondition='show';
        }
        this.chk.key = i;
        this.checkFilter.push(JSON.parse(JSON.stringify(this.chk)));
        console.log('checkFilter value'+ JSON.stringify(this.checkFilter));
        this.filterButton = 'Show';
    }

    // Fetch the text changed for the selected field.
    handleTextBoxChange(event) {
        var selectedRow = event.currentTarget;
        var key = selectedRow.dataset.id;
       // var accountVar = this.accountList[key];
        this.checkFilter[key].SearchText = event.detail.value;
    }

    // Fetch the changed field.
    handleFeldNameChange(event){
        var selectedRow = event.currentTarget;
        var key = selectedRow.dataset.id;
        //var accountVar = this.accountList[key];
        this.checkFilter[key].FieldName = event.target.value;
    }
 
    // Fetch the changed operator
    handleOperatorChange(event){
        var selectedRow = event.currentTarget;
        var key = selectedRow.dataset.id;
        this.checkFilter[key].Operator = event.detail.value;
    }

    // Fetch the changed condition
    handleConditionChange(event){
       this.selectedCondition = event.target.value;
       if(this.selectedCondition === 'customLogic'){
        this.showCustomLogic = 'shown';
       }
       else{
        this.showCustomLogic = '';
       }
    }

    // Fetch the changed custom logic
    handleLogicChange(event){
        this.customTxt = event.target.value;
    }

    // Fetch the changed isnumeric 
    handleCheckboxChange(event){
        var selectedRow = event.currentTarget;
        var key = selectedRow.dataset.id;
        this.checkFilter[key].Checkbox = event.detail.value;
        if(this.checkFilter[key].Checkbox === 'YES'){
            this.checkFilter[key].Options = [
                        { label: 'Equals', value: '=' },
                        { label: 'Greater Than(>)', value: '>' },
                        { label: 'Less Than(<)', value: '<' },
                        { label: 'Greater Equals(>=)', value: '>=' },
                        { label: 'Less Equals(<=)', value: '<=' }
                    ]
        }else if(this.checkFilter[key].Checkbox === 'NO'){
            this.checkFilter[key].Options = [
                { label: 'Equals', value: '=' },
                { label: 'Contains', value: 'contains' },
                { label: 'Starts with', value: 'startsWith' },
                { label: 'Ends with', value: 'endsWith' }
            ]
        }
    }

    // Save the added rows from the check filter and apply filter on all records.
    saveRecord(){
        this.whereString = "";
        let conditionDict;
        this.queryResults=[];
        console.log('inside save');
        if(!this.selectedCondition && this.showCondition==='show'){
            this.conditionEmpty = 1;
            this.showError = 'Please select any one condition';
            this.showErrorToast();
        }

        // For Custom Condition
        if(this.selectedCondition === 'customLogic'){
            for(let j =0;j<this.checkFilter.length;j++){
                console.log('Checkfilter J'+JSON.stringify(this.checkFilter[j]));
                let checkDict =this.checkFilter[j];
                if(j>0){
                  conditionDict = this.checkFilter[j-1];
                }
                console.log('Inside Check Dict-> '+typeof(checkDict));
                console.log('Inside Check Dict-> '+JSON.stringify(checkDict));
                if(checkDict['FieldName'] !== 'All'){
                    console.log('Inside if'+checkDict['FieldName']);
                    
                    // To be edited
                    if(checkDict['FieldName']==='' && checkDict['Operator']==='' && checkDict['Checkbox']===''){
                        console.log('Inside if edited'+checkDict['Operator']);
                        this.showError = 'Please fill the fields';
                        this.showErrorToast();
                    }

                    this.queryResults.push({'field': checkDict['FieldName'], 'Operator':checkDict['Operator'], 'text':checkDict['SearchText'], 
                'Numeric':checkDict['Checkbox']});
                }
            }
            console.log('Inside custom condition'+JSON.stringify(this.queryResults));

            let str = this.customTxt;
            let lst = this.queryResults;
            let query='';

            // Iterate the string and make the query
            for(let i =0; i<str.length;i++){
                if(!isNaN(str[i]) && str[i]!=' '){
                    if( lst[Number(str[i])]['Numeric'] == 'YES'){
                         query = query + lst[Number(str[i])]['field'] +' '+lst[Number(str[i])]['Operator'] + ' '+lst[Number(str[i])]['text'];
                    }
                    else{
                        if(lst[Number(str[i])]['Operator'] === '='){
                        query = query + lst[Number(str[i])]['field'] +' '+lst[Number(str[i])]['Operator'] + ' '+"'"+lst[Number(str[i])]['text']+"'";
                        }
                        else if(lst[Number(str[i])]['Operator'] === 'contains'){
                            query = query + lst[Number(str[i])]['field'] +" LIKE '%"+lst[Number(str[i])]['text']+"%'";
                        }
                        else if(lst[Number(str[i])]['Operator'] === 'startsWith'){
                            query = query + lst[Number(str[i])]['field'] +" LIKE '"+lst[Number(str[i])]['text']+"%'";
                        }
                        else if(lst[Number(str[i])]['Operator'] === 'endsWith'){
                            query = query + lst[Number(str[i])]['field'] +" LIKE '%"+lst[Number(str[i])]['text']+"'";
                        }
                    }
                    
                }
                else{
                    query+=str[i]
                    //console.log('Inside strings'+str[i]);
                }
            }
            console.log('Final query Inside custom condition'+query);
            this.whereString = query;
        }

        // For AND and OR conditions
        else{
            for(let j =0;j<this.checkFilter.length;j++){
            console.log('Checkfilter J'+JSON.stringify(this.checkFilter[j]));
            let checkDict =this.checkFilter[j];
            if(j>0){
              conditionDict = this.checkFilter[j-1];
            }
            console.log('Inside Check Dict-> '+typeof(checkDict));
            if(checkDict['FieldName'] !== 'All'){

                // To be edited
                if(checkDict['FieldName']==='' && checkDict['Operator']==='' && checkDict['Checkbox']===''){
                    console.log('Inside if edited'+checkDict['FieldName']);
                    this.showError = 'Please fill the fields';
                    this.showErrorToast();
                }

                console.log('Inside if'+checkDict['FieldName']);
                if(j===0){
                    if(checkDict['Checkbox'] == 'YES'){
                            if(checkDict['Operator'] === '='){
                            this.whereString += checkDict['FieldName'] +"= "+checkDict['SearchText'];
                            }else if(checkDict['Operator'] === '>'){
                            this.whereString += checkDict['FieldName'] +" > "+checkDict['SearchText'];
                            }else if(checkDict['Operator'] === '<'){
                            this.whereString += checkDict['FieldName'] +" < "+checkDict['SearchText'];
                            }else if(checkDict['Operator'] === '>='){
                            this.whereString += checkDict['FieldName'] +" >="+checkDict['SearchText'];    
                            }
                            else if(checkDict['Operator'] === '<='){
                                this.whereString += checkDict['FieldName'] +" <="+checkDict['SearchText'];
                            }
                        }
                    else{
                        if(checkDict['Operator'] === '='){
                        this.whereString += checkDict['FieldName'] +"= '"+checkDict['SearchText']+"'";
                        }else if(checkDict['Operator'] === 'contains'){
                        this.whereString += checkDict['FieldName'] +" LIKE '%"+checkDict['SearchText']+"%'";
                        }else if(checkDict['Operator'] === 'startsWith'){
                        this.whereString += checkDict['FieldName'] +" LIKE '"+checkDict['SearchText']+"%'";
                        }else if(checkDict['Operator'] === 'endsWith'){
                        this.whereString += checkDict['FieldName'] +" LIKE '%"+checkDict['SearchText']+"'";
                        }
                    }   
                }

                else if(j>0){
                    if(checkDict['Checkbox'] == 'YES'){
                        if(checkDict['Operator'] === '='){
                        this.whereString += ' '+this.selectedCondition+' '+checkDict['FieldName'] +"= "+checkDict['SearchText'];
                        }else if(checkDict['Operator'] === '>'){
                        this.whereString += ' '+this.selectedCondition+' '+checkDict['FieldName'] +" > "+checkDict['SearchText'];
                        }else if(checkDict['Operator'] === '<'){
                        this.whereString += ' '+this.selectedCondition+' '+checkDict['FieldName'] +" < "+checkDict['SearchText'];
                        }else if(checkDict['Operator'] === '>='){
                        this.whereString += ' '+this.selectedCondition+' '+checkDict['FieldName'] +" >="+checkDict['SearchText'];    
                        }else if(checkDict['Operator'] === '<='){
                        this.whereString += ' '+this.selectedCondition+' '+checkDict['FieldName'] +" <="+checkDict['SearchText'];
                        }
                    }
                    else{
                        console.log('Inside condition query'+conditionDict['Condition']);
                        if(checkDict['Operator'] === '='){
                            this.whereString += ' '+this.selectedCondition+' '+checkDict['FieldName'] +"= '"+ checkDict['SearchText']+"'";
                        }else if(checkDict['Operator'] === 'contains'){
                            this.whereString += ' '+this.selectedCondition+' '+checkDict['FieldName'] +" LIKE '%"+ checkDict['SearchText']+"%'";
                        }else if(checkDict['Operator'] === 'startsWith'){
                            this.whereString += ' '+this.selectedCondition+' '+checkDict['FieldName'] +" LIKE '"+ checkDict['SearchText']+"%'";
                        }else if(checkDict['Operator'] === 'endsWith'){
                            this.whereString += ' '+this.selectedCondition+' '+checkDict['FieldName'] +" LIKE '%"+ checkDict['SearchText']+"'";
                        }
                    }     
                }
            }
        }
    }
        console.log('Outside if loop '+JSON.stringify(this.checkFilter));
        console.log('query list--> '+JSON.stringify(this.queryResults));
        console.log('Where String--> '+this.whereString);
        this.noRun=1;
        this.handleShowData();
    }
    
    // When clicking on delete button decrement the checkfilter and remove the current row.
    removeRow(event){
        var selectedRow = event.currentTarget;
        var key = selectedRow.dataset.id;
        if(this.showCustomLogic && this.selectedCondition && this.customTxt){
            this.showCustomLogic ='';
             this.selectedCondition ='';
              this.customTxt='';
        }
        console.log('Inside remove Row '+ this.whereString);
        console.log('Inside remove Row '+ JSON.stringify(this.checkFilter));
        if(this.checkFilter.length>1){
            this.checkFilter.splice(key, 1);
            this.index--;
            var i =this.index;
        
            if(i===1){
                this.showCondition='';
                this.selectedCondition=''
                this.showCustomLogic=''

            }
        }else if(this.checkFilter.length === 1){
            this.checkFilter = [];
            this.index = 0;

        }
    }

}