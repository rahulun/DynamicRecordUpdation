public with sharing class updateRecordComp {
    @AuraEnabled(cacheable=true)
    public static List<Object__mdt> getObjects() {
        return [SELECT Label,Object_API_Name__c FROM Object__mdt WHERE Active__c=true ORDER BY Label];
    }

    @AuraEnabled(cacheable=true)
    public static List<Field__mdt> getFields(String selectedObject) {
        return [SELECT Label,Field_API_Name__c FROM Field__mdt WHERE Object__r.Object_API_Name__c =: selectedObject AND Active__c=true ORDER BY Label];
    }

    @AuraEnabled
    public static List<SObject> getRecords(String query) {
        List<SObject> sb = Database.query(query);
        return sb;
    }
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
            system.debug('insertLogObject-->'+insertLogObject);
            insertLogList.add(insertLogObject);
        }
        insert insertLogList;
    }
}
