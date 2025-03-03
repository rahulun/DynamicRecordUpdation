public with sharing class UpdateRecordHandler {

    // Apex method to fetch list of object from custom metadata.
    @AuraEnabled(cacheable=true)
    public static List<Object__mdt> getObjects() {
        return [SELECT Label,Object_API_Name__c FROM Object__mdt WHERE Active__c=true ORDER BY Label];
    }

    // Apex method to fetch list of fields of the selected object from custom metadata.
    @AuraEnabled(cacheable=true)
    public static List<Field__mdt> getFields(String selectedObject) {
        return [SELECT Label,Field_API_Name__c FROM Field__mdt WHERE Object__r.Object_API_Name__c =: selectedObject AND Active__c=true ORDER BY Label];
    }

    // Apex method to query the records from the selected objects and fields also fetch the filtered records if exist.
    @AuraEnabled
    public static List<Object> getRecords(String query) {
        List<SObject> sb = Database.query(query);
        //List<SObject> sb = Database.query(query+' WITH SECURITY_ENFORCED ');
        // Strip fields that are not readable
        SObjectAccessDecision decision = Security.stripInaccessible(AccessType.READABLE,sb);
        List<SObject> stripRecords = decision.getRecords();
        List<String> remove = new List<String>();
        Map<String,Set<String>> removedFields= decision.getRemovedFields();
        List<Object> ob = new List<Object>();
        ob.add(removedFields.values());
        ob.add(stripRecords);
        // for(String key:removedFields.keySet()){
        //     for(String s: removedFields.get(key)){
        //         remove.add(s);
        //     }
        // }
        // System.debug(remove+' fields '+removedFields.get('Account')+' records '+stripRecords);
        // System.debug('Fields removed by stripInaccessible: '+decision.getRemovedFields());
        return ob;
    }


    // Apex method to create DataFixLogger custom object record.
    @AuraEnabled
    public static void insertLoggerRecords(List <Map<String,String>> loggerList){
        
        List<Data_Fix_Logger__c> insertLogList = new  List<Data_Fix_Logger__c>();
       
        for (Map<String,String> loggerKeys : loggerList) {
            Data_Fix_Logger__c insertLogObject = new  Data_Fix_Logger__c();
            insertLogObject.Field_Name__c=loggerKeys.get('fieldName');
            insertLogObject.Object_Name__c=loggerKeys.get('Object Name');
            insertLogObject.Updated_By__c=loggerKeys.get('Updated by');
            insertLogObject.New_Value__c=loggerKeys.get('newValue');
            insertLogObject.Old_Value__c=loggerKeys.get('oldValue');
            insertLogObject.Record_Id__c=loggerKeys.get('id');
            //system.debug('insertLogObject-->'+insertLogObject);
            insertLogList.add(insertLogObject);
        }
        insert insertLogList;
    }
}