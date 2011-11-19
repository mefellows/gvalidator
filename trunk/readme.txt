GValidator (v0.5.49) - Javascript Validation library from OneGeek (http://www.onegeek.com.au)

----------------------------------------------------------------

GValidator is a lightweight javascript form validation library that automatically 
adds client-side validation to form elements, without needing to write a single line of javascript.

The aims of the project are to provide the following:

	  * A user-friendly experience
    * A reusable and lightweight library            
    * Semantically clean code 
    * Standards compliant code
    * Cross browser compatibility
    * Code flexibility and extensibility   
    * promote adoption via ease of use


How to use GValidator (Simple Usage)
----------------------------------------------------------------
To use the library all you need to do is:

  * Copy the icons folder into your image directory
  * Set the ICON_DIR variable in gvalidator.js to point to this location
   
      i.e. ICON_DIR = '/images/icons';
  
  * Include the gvalidator.css script file in the header of the page
  
     <link rel="stylesheet" type="text/css" href="/css/gvalidator.css" media="screen"/>
    
  * Include the gvalidator.js script file at the bottom of the page, just before </body>
  
     i.e. <script type="text/javascript" src="/js/gvalidator.js"></script>
    
  * The form is given a class attribute of "gform" to activate GValidator
  * The fields for validation are given various obvious class names depending on how we wish to validate them. 
    i.e. class="name", class="phone", class="text" etc.

There is no embedded JavaScript functions or invalid semantic markup here, just clean, straight-up XHTML.
    
Advance GValidator usage
----------------------------------------------------------------
GValidator is quite flexible and extensible. It also provides a simple internationalization mechanisem.

-- Configuration Options --
GValidator has the following options, passed in to a variable with name 'ONEGEEK.forms.GValidator.options'.
This variable is a literal object, containing key/value pairs.
  
    Parameter        Accepted Values                 Description
    ==========================================================================================================================================
    reqShow          [Boolean]                       Automatically add the required char to labels?
    reqChar          [String]                        Character used to indicate a required field
    reqPlacement     ['after', 'before']             Position of required character. Can be 'before' or 'after'
    autoFocus        [true,false]                    Automatically focus the first form element on page load
    supressAlert     [Boolean]                       Supresses the javascript alert on an invalid form submission 
    highlightFields  [Boolean]                       Will apply a class name of 'highlight' to any invalid field on form submission attempt.    
    
    Element level messaging display options
    ---------------------------------------
    eMsgFormat       ['open','compact']              How to display messages next to the field. 
                                                     - 'open' refers to always showing the message
                                                     - 'compact' only shows if the user performs an event on the field's icon.
    eMsgEventOn      [String (DOM Event)]            Only used if eMsgFormat = 'compact'. Event used to trigger message display toggle
    eMsgEventOff     [null, 'click', 'mouseout' ...] Only used if eMsgFormat = 'compact'. Event used to trigger message hide toggle. 
                                                     MUST NOT BE THE SAME AS 'eMsgEventOff' or they will cancel each other out
    
    Form level messaging display options
    ------------------------------------
    fMsgFormat       [null, String, Function]        How to display errors at the form level. 
                                                     - null displays an alert to the user indicating there are errors to be corrected. See fMsg to override default message.
                                                     - String - Pass in an id reference to a container div to place the errors in as a <ul class="gvErrorsList">
                                                     - Function   - To do something custom on form submission error, pass in a function that accepts 1 parameter containing all of the error fields (ONEGEEK.forms.AbstractFormField[])   
    fMsg             [String]                        A string alert to display on error i.e. "Please correct the highlighted errors!",

    Image parameters for 'compact' messages
    ------------------------------------------
    icons: {
      ok             [String]                        Path to the OK state icon
      info           [String]                        Path to the INFO state icon
      error:         [String]                        Path to the ERROR state icon
    }

-- Internationalization (I8N) --
To specify a language translation for a form, simply do the following:

- apply the W3C attribute 'lang' to the <form> with the value of the Country to translate i.e. lang="DE"
- Create a variable with the name ONEGEEK.forms.GValidator.translation.<lang> i.e. ONEGEEK.forms.GValidator.translation.DE
- In that Object map, each top level key should correspend to an existing validator type, and the second-level key/value pairs for the different message types
  To set defaults across ALL validator types, use the special top-level key 'defaults' i.e. 

ONEGEEK.forms.GValidator.translation.DE = {  
    defaults: {
      successMsg: 'Danke',
      contextMsg: 'Bitte füllen Sie',
      errorMsg: 'Kaputt! Es wurde ein Fehler beim Überprüfen diesem Bereich',
      emptyMessage: 'Pflichtfeld, füllen Sie bitte.',
    },        
    firstname: {
      contextMsg: 'Wir möchten Sie von Ihrem Namen zu nennen'
    },
    ...
};

- To set the form level error message, override the 'fMsg' property like the following:

ONEGEEK.forms.GValidator.options = {  
    fMsg: "Bitte korrigieren Sie die markierten Fehler!"
};

-- Extending GValidator (simple plugins) --
Example of a new IP 4 Address validator:

ONEGEEK.forms.GValidator.plugins = {
    ip4address: {
        _extends:     'GenericTextField',
        regex:        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/g,
        cleanRegex:   /[^0-9\.]/g,
        contextMessage: 'Please enter a valid IP 4 Address i.e. 127.0.0.1',
        errorMessage: 'Please enter a valid IP 4 Address i.e. 127.0.0.1',   
        successMessage: 'Thanks'  
    }    
};

-- Extending GValidator (advanced) --
 See the documentation at www.onegeek.com.au for more details on this.
    
Also
----------------------------------------------------------------
To get the latest code, view or post bugs or learn more go to:
 * code.google.com/p/gvalidator


GValidator Change Log
----------------------------------------------------------------
0.5.90
--
 - Minor bug fix for single checkbox forms.

0.5.49
--

Major updates include:
 - Internationalisation and translation file support added.
 - Easy configuration, and form specific configuration via class names and id's
 - Simple plugin file support
 - Empty fields now have separate error messages
 - Form level validation can be passed to a function handler via configuration
 - Form level validation errors can be displayed in a container div via a configuration option
 - Element level configuration options
 - DEPRECATION of the following params
   - ENABLE_COMPACT_MESSAGES (replace with config option eMsgFormat: 'compact')
   - ICON_* (replaced by config options icons: {error: 'image/path', info...} ) 

0.4.30
--
Bug fix (Issue 4). Generic text field did not take 'required' flag into consideration, and is now more closely related to AbstractTextField, in that it has a universal 'this.regex' predicate.


0.4.25
--
GValidator now resets along with a form reset.


0.4.20
--
 Added ability to use the 'required' class for validation purposes.
 Elements can now have multiple classes (for non-GValidator purposes) and it won't affect the GValidator validation


0.3.0
--
  Initial Release of GValidator on Google Code
  
  
Thanks
----------------------------------------------------------------
Icons in the example are provided by Fam Fam Fam (http://www.famfamfam.com/lab/icons/mini/)  