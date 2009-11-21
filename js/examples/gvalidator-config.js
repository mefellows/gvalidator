ONEGEEK.forms.GValidator.options = {
    // Generic GValidator options that will be applied to any form without a specific section below.    
    // Edit to suit your environment
    reqShow: true,            // Automatically add the required char to labels?
    reqChar: '*',             // Character used to indicate a required field
    reqPlacement: 'after',    // Position of required character. Can be 'before' or 'after'
    autoFocus: true,          // Automatically focus the first form element on page load
    supressAlert: false,      // Supresses the javascript alert on an invalid form submission 
    highlightFields: 'highlight',    // Will apply a class name of 'highlight' to any invalid field on form submission attempt.    
    
    // Element level formatting options 
    eMsgFormat: 'compact',
    eMsgEventOn:  'mouseover', // Used for compact messages. Event used to trigger message display toggle
    eMsgEventOff: 'mouseout',  // Used for compact messages. Event used to trigger message hide toggle. MUST NOT BE THE SAME AS 'eMsgEventOff' or they will cancel each other out

    // Form level formatting options
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
      
      // Image params
      icons: {
        error:  '../images/icons/custom/asterisk_orange.png',
        info:   '../images/icons/custom/comment.gif',
      }, 

      // Form params
      fMsg: "Please correct the highlighted errors!",      
      
      // Function params example      
      fMsgFormat: function(errors) {
        var msg = "Please correct the following errors: \n\n";
        for(var i = 0; i < errors.length; i++) {          
          msg += errors[i].label + " - " + errors[i].errorMsg + "\n";
        }
        alert(msg);
        return false;
      },
      
      // Container params example
      //fMsgFormat: 'errors',
      
      // We are using a function which alerts, so stop the default alert from occuring
      supressAlert: true
    }
};