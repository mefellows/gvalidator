ONEGEEK.forms.GValidator.options = {
    // Generic GValidator options that will be applied to any form without a specific section below.    
    // Edit to suit your environment
    reqShow: true,            // Automatically add the required char to labels?
    reqChar: '*',             // Character used to indicate a required field
    reqPlacement: 'after',    // Position of required character. Can be 'before' or 'after'
    autoFocus: true,          // Automatically focus the first form element on page load
    supressAlert: false,      // Supresses the javascript alert on an invalid form submission 
    highlightFields: true,    // Will apply a class name of 'highlight' to any invalid field on form submission attempt.    
    
    /*
     * How to display _element_ level messages. One of:
     * 
     * - open (Default. Shows messages next to form at all times. Best)
     * - compact (Shows messages as expandable icons next to the field, requires icons to be specified)
     * - function (This function will be initiated on error)
     */  
    eMsgFormat: 'compact',
    eMsgEventOn:  'mouseover', // Used for compact messages. Event used to trigger message display toggle
    eMsgEventOff: 'mouseout',  // Used for compact messages. Event used to trigger message hide toggle. MUST NOT BE THE SAME AS 'eMsgEventOff' or they will cancel each other out
    
    /*
     * How to display _form_ level messages. One of:
     * - null (default). Will display an alert message.
     * - container (must specify a 'containerId' with an id of a containing element, which will be populated with a <ul>)
     * - variable
     * - function (This function will be initiated on error)
     * 
     */   
    fMsgFormat: null,   
    fMsg: "Please correct the highlighted errors!",
    
    // Image references for 'compact' messages
    icons: {
      ok:     '../images/icons/tick.png',
      info:   '../images/icons/help.png',
      error:  '../images/icons/icon_alert.gif'
    },
    
    // Specific form customisation options
    // This will inherit from the above options
    "example-custom-form": {
      
      // General params
      reqChar: '^',
      eMsgFormat: 'open',
      //eMsgFormat: 'function', 
      eMsgFunction: function(field) {
        alert('Please correct this field: ' + field.label);
      },
      
      // Image params
      icons: {
        error:  '../images/icons/custom/asterisk_orange.png',
        info:   '../images/icons/custom/comment.gif',
      }, 

      // Form params
      fMsgFormat: "function",   
      fMsg: "Please correct the highlighted errors!",
      
      // Container params example
      fMsgContainer: "errors",
      
      // Function params example      
      fMsgFunction: function(errors) {
        var msg = "Please correct the following errors: \n\n";
        for(var i = 0; i < errors.length; i++) {          
          msg += errors[i].label + " - " + errors[i].errorMsg + "\n";
        }
        alert(msg);
        return false;
      },
      supressAlert: true, // We are using a function which alerts, so stop this
    }
};